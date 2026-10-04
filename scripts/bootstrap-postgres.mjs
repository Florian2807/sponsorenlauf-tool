#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { importSqlite, snapshotSqlite } from '../src/utils/sqliteImport.js';
import { getLegacyDatabasePath } from '../src/utils/migration/paths.js';
import { getPostgresPool, closePostgresPools, isPostgres } from '../src/utils/postgres.js';
import { runDatabaseMigrations } from '../src/utils/migrationService.js';
import { readTransition, writeTransition } from '../src/utils/migrationGate.js';

const exists = async filename => { try { await fs.access(filename); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
const maintenance = async () => {
    const directory = process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
    if (!directory) return null;
    const file = path.join(directory, 'status.json');
    if (!await exists(file)) return null;
    return JSON.parse(await fs.readFile(file, 'utf8'));
};
try {
    if (!isPostgres()) throw new Error('PostgreSQL configuration is required');
    const previous = readTransition();
    if (previous?.phase === 'completed') {
        if (previous.manifest) {
            const marker = await getPostgresPool().query('SELECT source_hash FROM database_transition WHERE id = 1');
            if (marker.rows[0]?.source_hash !== previous.manifest.sourceHash) throw new Error('PostgreSQL target does not match the completed migration');
        } else {
            const schema = await getPostgresPool().query("SELECT to_regclass('public.schema_migrations') AS name");
            if (!schema.rows[0].name) throw new Error('Previously initialized PostgreSQL target is missing');
        }
        await runDatabaseMigrations();
    } else {
        const current = await maintenance();
        const updating = current?.action === 'update' && current?.state === 'running';
        const requestId = updating ? current.requestId : previous?.requestId || null;
        const source = getLegacyDatabasePath();
        if (previous?.requestId && previous.requestId !== requestId && !updating) throw new Error('Interrupted migration needs its update to be resumed');
        if (await exists(source)) {
            const directory = path.join(path.dirname(source), 'migrations');
            await fs.mkdir(directory, { recursive: true, mode: 0o700 });
            const sameRequest = previous?.requestId === requestId && previous?.snapshot;
            const snapshot = sameRequest ? previous.snapshot : path.join(directory, `sqlite-${randomUUID()}.db`);
            let state = sameRequest ? previous : { phase: 'write_locked', requestId, snapshot };
            writeTransition(state);
            if (!await exists(snapshot)) await snapshotSqlite(source, snapshot);
            if (updating) {
                // The legacy shell keeps this filename in a local variable. Keep
                // its rollback contract but refresh its data after the old app stopped.
                const log = await fs.readFile(path.join(process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY, 'update.log'), 'utf8');
                const names = log.split(/\r?\n/).filter(line => /^\d{4}-\d{2}-\d{2}T[\w-]+_before-web-update_[0-9a-f]{8}\.(db|dump)$/.test(line));
                if (names.length !== 1) throw new Error('Cannot identify the updater rollback backup unambiguously');
                const destination = path.join(process.env.SPONSORENLAUF_BACKUP_DIRECTORY || path.join(path.dirname(source), 'backups'), names[0]);
                if (!names[0].endsWith('.db') || !await exists(destination)) throw new Error('Legacy rollback snapshot missing');
                const originalBackup = path.join(directory, `before-update-${requestId}.db`);
                if (!await exists(originalBackup)) await fs.copyFile(destination, originalBackup);
                const temporary = destination + '.refresh';
                await fs.copyFile(snapshot, temporary);
                await fs.chmod(temporary, 0o600);
                await fs.rename(temporary, destination);
                state = { ...state, rollbackBackup: names[0] };
            }
            writeTransition({ ...state, phase: 'snapshot_verified' });
            // PostgreSQL may still be switching from its initialization server
            // to TCP service. Keep the refreshed rollback snapshot while retrying.
            for (let attempt = 0; ; attempt += 1) {
                try { await getPostgresPool().query('SELECT 1'); break; }
                catch (error) {
                    if (attempt >= 20) throw error;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            const imported = await getPostgresPool().query("SELECT to_regclass('public.database_transition') AS name");
            const replace = Boolean(imported.rows[0].name && previous && previous.requestId !== requestId && updating);
            const manifest = await importSqlite(snapshot, { replace, replaceIdentity: replace });
            state = { ...state, phase: requestId ? 'awaiting_update' : 'completed', manifest };
            writeTransition(state);
            console.log('SQLite data imported and verified.');
        } else {
            if (previous) throw new Error('Migration source missing');
            await runDatabaseMigrations();
            writeTransition({ phase: 'completed', freshInstallation: true });
        }
    }
} catch (error) { console.error('PostgreSQL bootstrap failed:', error.message); process.exitCode = 1; }
finally { await closePostgresPools(); }
