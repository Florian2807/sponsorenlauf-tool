#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectDirectory = process.cwd();
const dataDirectory = path.join(projectDirectory, '.local-data');

process.env.APP_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.SPONSORENLAUF_RUNTIME = 'development';
process.env.SPONSORENLAUF_DATABASE_PATH ||= path.join(dataDirectory, 'development.db');
process.env.SPONSORENLAUF_BACKUP_DIRECTORY ||= path.join(dataDirectory, 'backups');
process.env.SPONSORENLAUF_SECRET_KEY ||= 'development-only-secret';

await mkdir(process.env.SPONSORENLAUF_BACKUP_DIRECTORY, { recursive: true });
const { runDatabaseMigrations } = await import('../src/utils/migrationService.js');
const migration = await runDatabaseMigrations();
if (migration.applied.length) {
    console.log(`Applied development migrations: ${migration.applied.join(', ')}`);
}

const nextBinary = path.join(projectDirectory, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBinary, 'dev'], {
    cwd: projectDirectory,
    env: process.env,
    stdio: 'inherit',
});

child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 1);
});
