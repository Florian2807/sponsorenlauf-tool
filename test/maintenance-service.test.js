import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chmod, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { queueMaintenanceAction } from '../src/utils/maintenanceService.js';

test('maintenance queue atomically accepts only one concurrent operation', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'sponsorenlauf-maintenance-'));
    const previousEnvironment = process.env.APP_ENV;
    const previousDirectory = process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
    process.env.APP_ENV = 'production';
    process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = directory;

    try {
        const results = await Promise.allSettled([
            queueMaintenanceAction('update'),
            queueMaintenanceAction('restart'),
        ]);
        assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
        const rejected = results.find(({ status }) => status === 'rejected');
        assert.equal(rejected.reason.code, 'ACTION_IN_PROGRESS');
        assert.equal((await readdir(directory)).filter((name) => name.endsWith('.request')).length, 1);
    } finally {
        if (previousEnvironment === undefined) delete process.env.APP_ENV;
        else process.env.APP_ENV = previousEnvironment;
        if (previousDirectory === undefined) delete process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
        else process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = previousDirectory;
        await rm(directory, { recursive: true, force: true });
    }
});

test('maintenance queue recovers a lock left by a legacy agent after completion', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'sponsorenlauf-maintenance-'));
    const previousEnvironment = process.env.APP_ENV;
    const previousDirectory = process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
    process.env.APP_ENV = 'production';
    process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = directory;

    try {
        await writeFile(path.join(directory, 'operation.lock'), 'previous-request\n');
        await writeFile(path.join(directory, 'status.json'), JSON.stringify({
            state: 'succeeded',
            action: 'update',
            requestId: 'previous-request',
            message: 'Update erfolgreich installiert.',
            updatedAt: new Date().toISOString(),
        }));

        const queued = await queueMaintenanceAction('restart');

        assert.equal(queued.state, 'queued');
        assert.equal((await readFile(path.join(directory, 'operation.lock'), 'utf8')).trim(), queued.requestId);
        assert.equal((await readdir(directory)).filter((name) => name.endsWith('.request')).length, 1);
    } finally {
        if (previousEnvironment === undefined) delete process.env.APP_ENV;
        else process.env.APP_ENV = previousEnvironment;
        if (previousDirectory === undefined) delete process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
        else process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = previousDirectory;
        await rm(directory, { recursive: true, force: true });
    }
});

test('maintenance queue replaces legacy read-only log files', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'sponsorenlauf-maintenance-'));
    const previousEnvironment = process.env.APP_ENV;
    const previousDirectory = process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
    process.env.APP_ENV = 'production';
    process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = directory;

    try {
        const progressPath = path.join(directory, 'progress.log');
        const rawLogPath = path.join(directory, 'update.log');
        await Promise.all([
            writeFile(progressPath, 'legacy progress\n'),
            writeFile(rawLogPath, 'legacy details\n'),
        ]);
        await Promise.all([chmod(progressPath, 0o440), chmod(rawLogPath, 0o440)]);

        await queueMaintenanceAction('update');

        assert.match(await readFile(progressPath, 'utf8'), /Update wurde angefordert/);
        assert.match(await readFile(rawLogPath, 'utf8'), /UPDATE/);
        assert.equal((await stat(progressPath)).mode & 0o777, 0o660);
        assert.equal((await stat(rawLogPath)).mode & 0o777, 0o660);
    } finally {
        if (previousEnvironment === undefined) delete process.env.APP_ENV;
        else process.env.APP_ENV = previousEnvironment;
        if (previousDirectory === undefined) delete process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
        else process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = previousDirectory;
        await rm(directory, { recursive: true, force: true });
    }
});
