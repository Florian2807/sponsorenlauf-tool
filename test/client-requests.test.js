import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clientRequest, clearClientRequestCache } from '../src/utils/clientRequests.js';

const response = (config, value) => ({ config, status: 200, statusText: 'OK', headers: {}, data: value });

test('simultaneous reads share transport; cached reads refresh after a successful write', async () => {
    clearClientRequestCache();
    let reads = 0;
    let release;
    const held = new Promise(resolve => { release = resolve; });
    const adapter = async config => {
        if (config.method === 'get') { reads++; await held; }
        return response(config, reads);
    };
    const options = { url: '/shared-resource', method: 'GET', cacheMs: 30000, adapter };
    const first = clientRequest(options);
    const second = clientRequest(options);
    release();
    assert.equal((await first).data, (await second).data);
    assert.equal(reads, 1);
    await clientRequest(options);
    assert.equal(reads, 1);
    await clientRequest({ ...options, method: 'POST' });
    await clientRequest(options);
    assert.equal(reads, 2);
});

test('failed reads retry and a stale in-flight response cannot refill a cleared cache', async () => {
    clearClientRequestCache();
    let fail = true;
    let calls = 0;
    const options = { url: '/retry-resource', cacheMs: 30000, adapter: async config => {
        calls++;
        if (fail) throw new Error('offline');
        return response(config, calls);
    } };
    await assert.rejects(clientRequest(options), /offline/);
    fail = false;
    assert.equal((await clientRequest(options)).data, 2);
    let release;
    const slow = { ...options, url: '/slow-resource', adapter: config => new Promise(resolve => { release = () => resolve(response(config, 1)); }) };
    const pending = clientRequest(slow);
    clearClientRequestCache();
    release(); await pending;
    let refreshed = false;
    await clientRequest({ ...slow, adapter: async config => { refreshed = true; return response(config, 2); } });
    assert.equal(refreshed, true);
});
