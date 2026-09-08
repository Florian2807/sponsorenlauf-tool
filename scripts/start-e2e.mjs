#!/usr/bin/env node

import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectDirectory = process.cwd();
const dataDirectory = path.join(projectDirectory, '.e2e-data');
const databasePath = path.join(dataDirectory, 'test.db');

await rm(dataDirectory, { recursive: true, force: true });
await mkdir(path.join(dataDirectory, 'backups'), { recursive: true });

process.env.APP_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.SPONSORENLAUF_RUNTIME = 'development';
process.env.SPONSORENLAUF_DATABASE_PATH = databasePath;
process.env.SPONSORENLAUF_BACKUP_DIRECTORY = path.join(dataDirectory, 'backups');
process.env.SPONSORENLAUF_SECRET_KEY = 'e2e-only-secret';
process.env.SPONSORENLAUF_NEXT_DIST_DIR = '.next-e2e';
process.env.PORT = '3100';

const { runDatabaseMigrations } = await import('../src/utils/migrationService.js');
const { dbRun } = await import('../src/utils/database.js');

await runDatabaseMigrations();
await dbRun(
    'INSERT INTO classes (grade, class_name) VALUES (?, ?)',
    ['5', '5a']
);
await dbRun(
    'INSERT INTO students (id, vorname, nachname, klasse, geschlecht) VALUES (?, ?, ?, ?, ?)',
    [1001, 'Erika', 'Mustermann', '5a', 'weiblich']
);
await dbRun(
    'INSERT INTO settings (key, value) VALUES (?, ?)',
    ['setup_completed', JSON.stringify(true)]
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
child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
});
