import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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
