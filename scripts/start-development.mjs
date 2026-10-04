#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { configureLocalPostgres } from './local-postgres.mjs';
import { closePostgresPools, getPostgresPool } from '../src/utils/postgres.js';

const projectDirectory = process.cwd();
const dataDirectory = path.join(projectDirectory, '.local-data');

process.env.APP_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.SPONSORENLAUF_RUNTIME = 'development';
process.env.SPONSORENLAUF_DATABASE_PATH ||= path.join(dataDirectory, 'development.db');
process.env.SPONSORENLAUF_BACKUP_DIRECTORY ||= path.join(dataDirectory, 'backups');
process.env.SPONSORENLAUF_SECRET_KEY ||= 'development-only-secret';

await configureLocalPostgres();
await mkdir(process.env.SPONSORENLAUF_BACKUP_DIRECTORY, { recursive: true });
const { existsSync } = await import('node:fs');
const pool = getPostgresPool();
const transitionTable = await pool.query("SELECT to_regclass('public.database_transition') AS name");
const imported = transitionTable.rows[0].name
    ? (await pool.query('SELECT 1 FROM database_transition WHERE id = 1')).rowCount > 0
    : false;
if (imported) {
    console.log('Using existing PostgreSQL development database (SQLite import already completed).');
} else if (existsSync(process.env.SPONSORENLAUF_DATABASE_PATH)) {
    const { importSqlite } = await import('../src/utils/sqliteImport.js');
    await importSqlite(process.env.SPONSORENLAUF_DATABASE_PATH);
}
const { runDatabaseMigrations } = await import('../src/utils/migrationService.js');
const migration = await runDatabaseMigrations();
if (migration.applied.length) {
    console.log(`Applied development migrations: ${migration.applied.join(', ')}`);
}
await closePostgresPools();

const nextBinary = path.join(projectDirectory, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBinary, 'dev'], {
    cwd: projectDirectory,
    env: process.env,
    stdio: 'inherit',
});

let shutdownSignal;
const stop = (signal) => {
    if (shutdownSignal) return;
    shutdownSignal = signal;
    // Keep the wrapper alive until Next has finished cleaning up its terminal
    // and child processes, even when Ctrl+C also signals Next directly.
    child.kill(signal);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

child.on('error', (error) => {
    console.error(`Failed to start Next.js: ${error.message}`);
    process.exitCode = 1;
});
child.on('close', (code, signal) => {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    const stoppedBy = shutdownSignal || signal;
    process.exitCode = stoppedBy === 'SIGINT' ? 130
        : stoppedBy === 'SIGTERM' ? 143
            : code ?? 1;
});
