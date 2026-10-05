import sqlite3 from 'sqlite3';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getPostgresPool, pgQuery } from './postgres.js';
import { runDatabaseMigrations } from './migrationService.js';

const execute = promisify(execFile);
import { APPLICATION_TABLES } from './databaseTables.js';
export { APPLICATION_TABLES } from './databaseTables.js';
// SQLite snapshots use the frozen legacy schema; scanner stations were added
// after the PostgreSQL transition and must not be read from legacy snapshots.
const LEGACY_APPLICATION_TABLES = APPLICATION_TABLES.filter((table) => table !== 'scanner_stations');
const open = (filename) => new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filename, sqlite3.OPEN_READONLY, error => error ? reject(error) : resolve(db));
});
const all = (db, sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
const close = db => new Promise((resolve, reject) => db.close(error => error ? reject(error) : resolve()));
export const snapshotSqlite = async (source, target) => {
    const db = await open(source);
    try {
        await new Promise((resolve, reject) => {
            const backup = db.backup(target);
            const step = () => backup.step(256, (error, done) => {
                if (error || done) backup.finish(() => error ? reject(error) : resolve());
                else setImmediate(step);
            });
            step();
        });
        await fs.chmod(target, 0o600);
        const copy = await open(target);
        try {
            const [check] = await all(copy, 'PRAGMA integrity_check');
            if (check.integrity_check !== 'ok') throw new Error('SQLite snapshot integrity check failed');
        } finally { await close(copy); }
    } finally { await close(db); }
};
const digestRows = (rows, columns) => {
    const hash = createHash('sha256');
    for (const row of rows) hash.update(JSON.stringify(columns.map(column => row[column])) + '\n');
    return hash.digest('hex');
};

// Import only into an empty, migrated target. Source is never opened for writing.
export const importSqlite = async (source, { replace = false, replaceIdentity = false, beforeReplace } = {}) => {
    const temporary = path.join(path.dirname(source), `.import-${randomUUID()}.db`);
    let db;
    let client;
    try {
        await snapshotSqlite(source, temporary);
        const sourceHash = createHash('sha256').update(await fs.readFile(temporary)).digest('hex');
        const environment = { ...process.env, SPONSORENLAUF_SQLITE_IMPORT_PATH: temporary, SPONSORENLAUF_RUNTIME: 'development' };
        for (const key of ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGPASSWORD_FILE']) delete environment[key];
        const original = await open(temporary);
        try {
            const names = (await all(original, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")).map(row => row.name);
            const required = APPLICATION_TABLES.slice(0, 8);
            if (required.some(table => !names.includes(table))) throw new Error('Not a Sponsorenlauf SQLite database');
            if (names.some(table => !APPLICATION_TABLES.includes(table) && table !== 'schema_migrations')) throw new Error('Source contains unsupported tables');
            if ((await all(original, 'PRAGMA foreign_key_check')).length) throw new Error('Source contains invalid foreign keys');
        } finally { await close(original); }
        // Upgrade an isolated copy of legacy schemas with the existing SQLite migrations.
        await execute(process.execPath, [path.resolve('scripts/upgrade-sqlite-import.mjs')], { env: environment });
        db = await open(temporary);
        await runDatabaseMigrations();
        client = await getPostgresPool().connect();
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [731504]);
        await client.query('CREATE TABLE IF NOT EXISTS database_transition (id INTEGER PRIMARY KEY CHECK(id = 1), source_hash TEXT NOT NULL, manifest JSONB NOT NULL)');
        const existing = await client.query('SELECT * FROM database_transition WHERE id = 1');
        if (!replace && existing.rows.length) {
            if (existing.rows[0].source_hash !== sourceHash) throw new Error('Target was imported from a different SQLite snapshot');
            await client.query('COMMIT');
            return { ...existing.rows[0].manifest, alreadyImported: true };
        }
        if (!replace) {
            for (const table of APPLICATION_TABLES) {
                const result = await client.query(`SELECT 1 FROM "${table}"${table === 'scanner_stations' ? " WHERE id <> 'default'" : ''} LIMIT 1`);
                if (result.rows.length) throw new Error(`Import target is not empty: ${table}`);
            }
        } else {
            await beforeReplace?.();
            for (const table of [...APPLICATION_TABLES].reverse()) await client.query(`DELETE FROM "${table}"`);
        }
        const tables = {};
        for (const table of LEGACY_APPLICATION_TABLES) {
            const columns = (await all(db, `PRAGMA table_info("${table}")`)).map(row => row.name);
            const targetColumns = (await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 ORDER BY ordinal_position', [table])).rows.map(row => row.column_name);
            if (columns.some(column => !targetColumns.includes(column))) throw new Error(`Unsupported source columns in ${table}`);
            const primaryKey = (await all(db, `PRAGMA table_info("${table}")`)).filter(row => row.pk).sort((a, b) => a.pk - b.pk).map(row => row.name);
            const order = primaryKey.map(column => `"${column}"`).join(',');
            const rows = await all(db, `SELECT * FROM "${table}" ORDER BY ${order}`);
            for (let offset = 0; offset < rows.length; offset += 250) {
                const batch = rows.slice(offset, offset + 250);
                const values = [];
                const tuples = batch.map(row => '(' + columns.map(column => { values.push(row[column]); return '$' + values.length; }).join(',') + ')');
                await client.query(`INSERT INTO "${table}" (${columns.map(column => `"${column}"`).join(',')}) VALUES ${tuples.join(',')}`, values);
            }
            const copied = await pgQuery(client, `SELECT * FROM "${table}" ORDER BY ${order}`);
            const sourceDigest = digestRows(rows, columns);
            if (copied.rows.length !== rows.length || digestRows(copied.rows, columns) !== sourceDigest) throw new Error(`Data verification failed: ${table}`);
            tables[table] = { count: rows.length, sha256: sourceDigest };
            const sequence = columns.includes('id')
                ? await client.query('SELECT pg_get_serial_sequence($1, $2) AS name', [table, 'id'])
                : { rows: [{ name: null }] };
            if (sequence.rows[0].name) await client.query(`SELECT setval($1::regclass, COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM "${table}"`, [sequence.rows[0].name]);
        }
        await client.query("INSERT INTO scanner_stations (id, name) VALUES ('default', 'Standard-Scanner') ON CONFLICT(id) DO NOTHING");
        const manifest = { sourceHash, tables, verifiedAt: new Date().toISOString(), version: process.env.SPONSORENLAUF_VERSION || 'development' };
        if (!replace || replaceIdentity || !existing.rows.length) await client.query('INSERT INTO database_transition(id, source_hash, manifest) VALUES (1, $1, $2) ON CONFLICT(id) DO UPDATE SET source_hash = excluded.source_hash, manifest = excluded.manifest', [sourceHash, JSON.stringify(manifest)]);
        await client.query('COMMIT');
        return manifest;
    } catch (error) {
        await client?.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        client?.release();
        if (db) await close(db);
        await fs.rm(temporary, { force: true });
        await fs.rm(temporary + '-wal', { force: true });
        await fs.rm(temporary + '-shm', { force: true });
    }
};

const closeDatabase = (db) => new Promise((resolve, reject) => {
    db.close((error) => {
        if (error) reject(error);
        else resolve();
    });
});

export const verifyDatabaseBackup = (backupPath) => new Promise((resolve, reject) => {
    const backupDb = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (openError) => {
        if (openError) {
            reject(openError);
            return;
        }

        backupDb.get('PRAGMA integrity_check', async (integrityError, row) => {
            try {
                if (integrityError) throw integrityError;
                if (row?.integrity_check !== 'ok') {
                    throw new Error(`Backup-Integritätsprüfung fehlgeschlagen: ${row?.integrity_check || 'unbekannt'}`);
                }

                await closeDatabase(backupDb);
                resolve();
            } catch (error) {
                try {
                    await closeDatabase(backupDb);
                } catch {
                    // Preserve the integrity-check error.
                }
                reject(error);
            }
        });
    });
});

const REQUIRED_APPLICATION_TABLES = [
    'classes',
    'students',
    'replacements',
    'teachers',
    'rounds',
    'expected_donations',
    'received_donations',
    'settings',
];

export const verifySqliteApplicationBackup = async (backupPath) => {
    await verifyDatabaseBackup(backupPath);
    return new Promise((resolve, reject) => {
        const backupDb = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (openError) => {
            if (openError) {
                reject(openError);
                return;
            }
            const placeholders = REQUIRED_APPLICATION_TABLES.map(() => '?').join(',');
            backupDb.all(
                `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`,
                REQUIRED_APPLICATION_TABLES,
                async (queryError, rows) => {
                    try {
                        if (queryError) throw queryError;
                        const found = new Set((rows || []).map((row) => row.name));
                        const missing = REQUIRED_APPLICATION_TABLES.filter((table) => !found.has(table));
                        if (missing.length > 0) {
                            throw new Error(`Keine gültige Sponsorenlauf-Datenbank; Tabellen fehlen: ${missing.join(', ')}`);
                        }
                        await closeDatabase(backupDb);
                        resolve();
                    } catch (error) {
                        try {
                            await closeDatabase(backupDb);
                        } catch {
                            // Preserve the schema validation error.
                        }
                        reject(error);
                    }
                }
            );
        });
    });
};
