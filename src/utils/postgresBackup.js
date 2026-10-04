import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { getPostgresPool, postgresConfig, pgQuery } from './postgres.js';
import { APPLICATION_TABLES } from './databaseTables.js';
const tool = async (name, args, input, database) => {
    const config = postgresConfig();
    if (database) {
        config.database = database;
        if (config.connectionString) { const url = new URL(config.connectionString); url.pathname = '/' + database; config.connectionString = url.toString(); }
    }
    const offline = name === 'pg_restore' && (args.includes('--list') || args.includes('--file=-'));
    const env = { ...process.env, PGPASSWORD: config.password || process.env.PGPASSWORD || '' };
    const connection = offline ? [] : config.connectionString ? ['--dbname', config.connectionString]
        : ['--host', config.host || '127.0.0.1', '--port', String(config.port), '--username', config.user, '--dbname', config.database];
    const container = process.env.SPONSORENLAUF_PG_TOOLS_CONTAINER;
    const command = container ? 'docker' : name;
    const options = container ? ['exec', '-i', '-e', `PGPASSWORD=${env.PGPASSWORD}`, container, name,
        ...(offline ? [] : ['--username', config.user, '--dbname', config.database]), ...args] : [...connection, ...args];
    return new Promise((resolve, reject) => {
        const child = execFile(command, options, { env, encoding: 'buffer', maxBuffer: 150 * 1024 * 1024 }, (error, stdout) => error ? reject(new Error(`${name} failed (exit ${error.code})`)) : resolve(stdout));
        child.stdin.on('error', () => {});
        child.stdin.end(input);
    });
};
export const createPostgresBackup = async (filename) => {
    const buffer = await tool('pg_dump', ['--format=custom', '--no-owner', '--no-privileges']);
    await fs.writeFile(filename, buffer, { mode: 0o600 });
    await verifyPostgresBackup(filename);
};
export const isPostgresArchive = async filename => {
    const file = await fs.open(filename, 'r');
    try { const bytes = Buffer.alloc(5); await file.read(bytes, 0, 5, 0); return bytes.toString() === 'PGDMP'; }
    finally { await file.close(); }
};
export const verifyPostgresBackup = async filename => {
    // Decode the entire archive, not only the table of contents. Restore runs as
    // the application role with ownership/privilege restoration disabled.
    const buffer = await fs.readFile(filename);
    const listing = (await tool('pg_restore', ['--list'], buffer)).toString();
    for (const table of APPLICATION_TABLES) {
        if (!listing.includes(` TABLE public ${table} `)) throw new Error(`Backup table missing: ${table}`);
    }
    await tool('pg_restore', ['--file=-', '--no-owner', '--no-privileges'], buffer);
};
export const restorePostgresBackup = async (filename, { beforeReplace } = {}) => {
    await verifyPostgresBackup(filename);
    const buffer = await fs.readFile(filename);
    const name = `restore_${randomUUID().replaceAll('-', '')}`;
    const pool = getPostgresPool();
    await pool.query(`CREATE DATABASE "${name}"`);
    const pg = await import('pg');
    const config = postgresConfig();
    const parsed = config.connectionString ? new URL(config.connectionString) : null;
    const staging = new pg.default.Pool({ ...config, connectionString: parsed
        ? (() => { parsed.pathname = '/' + name; return parsed.toString(); })() : undefined,
        database: name, max: 1 });
    let client;
    try {
        await tool('pg_restore', ['--exit-on-error', '--no-owner', '--no-privileges'], buffer, name);
        const version = await staging.query('SELECT MAX(version) AS version FROM schema_migrations');
        const current = await pool.query('SELECT MAX(version) AS version FROM schema_migrations');
        if (version.rows[0].version !== current.rows[0].version) throw new Error('Backup schema version does not match this application');
        client = await pool.connect();
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock($1)', [731504]);
        const recovery = await beforeReplace?.();
        for (const table of [...APPLICATION_TABLES].reverse()) await client.query(`DELETE FROM "${table}"`);
        for (const table of APPLICATION_TABLES) {
            const fields = (await staging.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position", [table])).rows.map(row => row.column_name);
            const liveFields = (await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position", [table])).rows.map(row => row.column_name);
            if (JSON.stringify(fields) !== JSON.stringify(liveFields)) throw new Error(`Backup schema differs: ${table}`);
            const data = await pgQuery(staging, `SELECT * FROM "${table}"`);
            for (let offset = 0; offset < data.rows.length; offset += 250) {
                const values = [];
                const tuples = data.rows.slice(offset, offset + 250).map(row => '(' + fields.map(field => { values.push(row[field]); return '$' + values.length; }).join(',') + ')');
                await client.query(`INSERT INTO "${table}" (${fields.map(field => `"${field}"`).join(',')}) VALUES ${tuples.join(',')}`, values);
            }
            if (fields.includes('id')) {
                const sequence = await client.query('SELECT pg_get_serial_sequence($1, $2) AS name', [table, 'id']);
                if (sequence.rows[0].name) await client.query(`SELECT setval($1::regclass, COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM "${table}"`, [sequence.rows[0].name]);
            }
        }
        await client.query('COMMIT');
        return { restored: true, backend: 'postgres', safetyBackup: recovery?.filename };
    } catch (error) {
        await client?.query('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        client?.release();
        await staging.end();
        await pool.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    }
};
