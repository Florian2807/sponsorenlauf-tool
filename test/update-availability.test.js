import test from 'node:test';
import assert from 'node:assert/strict';
import { getUpdateAvailability } from '../src/utils/updateAvailability.js';

test('only a newer main commit triggers an update notice, and repeated checks use the cache', async () => {
    const originalEnvironment = process.env.APP_ENV;
    const originalVersion = process.env.SPONSORENLAUF_VERSION;
    const originalFetch = globalThis.fetch;
    let requests = 0;
    try {
        process.env.APP_ENV = 'production';
        process.env.SPONSORENLAUF_VERSION = 'a'.repeat(40);
        globalThis.fetch = async () => {
            requests += 1;
            return { ok: true, json: async () => ({ status: 'ahead', ahead_by: 1, commits: [{ sha: 'b'.repeat(40) }] }) };
        };
        const result = await getUpdateAvailability();
        assert.equal(result.available, true);
        assert.equal(result.latestVersion, 'b'.repeat(40));
        await getUpdateAvailability();
        assert.equal(requests, 1);

        process.env.SPONSORENLAUF_VERSION = 'c'.repeat(40);
        globalThis.fetch = async () => ({ ok: true, json: async () => ({ status: 'diverged', ahead_by: 1, commits: [{ sha: 'd'.repeat(40) }] }) });
        assert.equal((await getUpdateAvailability()).available, false);

        process.env.APP_ENV = 'development';
        assert.equal((await getUpdateAvailability()).available, false);
    } finally {
        process.env.APP_ENV = originalEnvironment;
        process.env.SPONSORENLAUF_VERSION = originalVersion;
        globalThis.fetch = originalFetch;
    }
});
