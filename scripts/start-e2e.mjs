#!/usr/bin/env node

import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { configureLocalPostgres } from './local-postgres.mjs';

const projectDirectory = process.cwd();
const dataDirectory = path.join(projectDirectory, '.e2e-data');

await rm(dataDirectory, { recursive: true, force: true });
await mkdir(path.join(dataDirectory, 'backups'), { recursive: true });

process.env.APP_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.SPONSORENLAUF_RUNTIME = 'development';
process.env.SPONSORENLAUF_BACKUP_DIRECTORY = path.join(dataDirectory, 'backups');
process.env.SPONSORENLAUF_SECRET_KEY = 'e2e-only-secret';
process.env.SPONSORENLAUF_NEXT_DIST_DIR = '.next-e2e';
process.env.PORT = '3100';

await configureLocalPostgres();
const { postgresConfig } = await import('../src/utils/postgres.js');
const admin = new pg.Pool(postgresConfig());
const databaseName = 'e2e_' + randomUUID().replaceAll('-', '');
await admin.query(`CREATE DATABASE "${databaseName}"`);
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL); url.pathname = '/' + databaseName; process.env.DATABASE_URL = url.toString();
}
process.env.PGDATABASE = databaseName;

const { runDatabaseMigrations } = await import('../src/utils/migrationService.js');
const { dbRun } = await import('../src/utils/database.js');
const { setAdminPin } = await import('../src/utils/adminAuthService.js');

await runDatabaseMigrations();
await setAdminPin('246810');
await dbRun(
    'INSERT INTO classes (grade, class_name) VALUES (?, ?)',
    ['5', '5a']
);
await dbRun(
    'INSERT INTO students (id, vorname, nachname, klasse, geschlecht) VALUES (?, ?, ?, ?, ?)',
    [1001, 'Erika', 'Mustermann', '5a', 'weiblich']
);
await dbRun(
    'INSERT INTO students (id, vorname, nachname, klasse, geschlecht) VALUES (?, ?, ?, ?, ?)',
    [1002, 'Max', 'Beispiel', '5a', 'männlich']
);
for (let studentId = 1003; studentId <= 1008; studentId += 1) {
    await dbRun(
        'INSERT INTO students (id, vorname, nachname, klasse, geschlecht) VALUES (?, ?, ?, ?, ?)',
        [studentId, 'Test', `Schüler${studentId}`, '5a', 'männlich']
    );
}
for (let teacherId = 1; teacherId <= 4; teacherId += 1) {
    await dbRun(
        'INSERT INTO teachers (id, vorname, nachname, klasse, email) VALUES (?, ?, ?, ?, ?)',
        [teacherId, `Lehrer${teacherId}`, 'Test', teacherId <= 2 ? '5a' : null, `lehrer${teacherId}@example.org`]
    );
}
await dbRun(
    'INSERT INTO settings (key, value) VALUES (?, ?)',
    ['setup_completed', JSON.stringify(true)]
);
await dbRun(
    'INSERT INTO settings (key, value) VALUES (?, ?)',
    ['class_structure', JSON.stringify({ '5': ['5a'] })]
);

const nextBinary = path.join(projectDirectory, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBinary, 'dev', '--hostname', '127.0.0.1'], {
    cwd: projectDirectory,
    env: process.env,
    stdio: 'inherit',
});

const forwardSignal = (signal) => {
    if (!child.killed) child.kill(signal);
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));

child.on('exit', async (code, signal) => {
    const { closePostgresPools } = await import('../src/utils/postgres.js');
    await closePostgresPools();
    await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    await admin.end();
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
});
