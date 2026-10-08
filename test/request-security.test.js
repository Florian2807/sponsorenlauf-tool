import assert from 'node:assert/strict';
import test from 'node:test';
import { hasSafeRequestOrigin, isRoundCorrectionPage } from '../src/utils/requestSecurity.js';

test('allows browser-confirmed same-origin requests behind an internal container URL', () => {
    assert.equal(hasSafeRequestOrigin({
        method: 'POST',
        headers: new Headers({
            host: '10.0.0.1',
            origin: 'http://10.0.0.1',
            'sec-fetch-site': 'same-origin',
        }),
        urlHost: '0.0.0.0:3000',
    }), true);
});

test('rejects browser-confirmed cross-site requests even with a matching host', () => {
    assert.equal(hasSafeRequestOrigin({
        method: 'POST',
        headers: {
            host: '10.0.0.1',
            origin: 'http://10.0.0.1',
            'sec-fetch-site': 'cross-site',
        },
    }), false);
});

test('validates Origin against the public Host when Fetch Metadata is unavailable', () => {
    assert.equal(hasSafeRequestOrigin({
        method: 'POST',
        headers: { host: 'sponsorenlauf.local', origin: 'http://sponsorenlauf.local' },
        urlHost: 'app:3000',
    }), true);
    assert.equal(hasSafeRequestOrigin({
        method: 'POST',
        headers: { host: 'sponsorenlauf.local', origin: 'https://example.org' },
        urlHost: 'app:3000',
    }), false);
});

test('allows safe reads and non-browser clients without an Origin header', () => {
    assert.equal(hasSafeRequestOrigin({ method: 'GET', headers: {} }), true);
    assert.equal(hasSafeRequestOrigin({ method: 'POST', headers: { host: '10.0.0.1' } }), true);
});

test('public round corrections are scoped to scanner/profile pages on the actual request host', () => {
    const check = referer => isRoundCorrectionPage({
        headers: { host: '127.0.0.1:3100', referer }, urlHost: 'localhost:3100',
    });
    assert.equal(check('http://127.0.0.1:3100/scan'), true);
    assert.equal(check('http://127.0.0.1:3100/show?student=1'), true);
    assert.equal(check('http://127.0.0.1:3100/manage'), false);
    assert.equal(check('http://127.0.0.1:3100/statistics'), false);
    assert.equal(check('http://other.example/show'), false);
    assert.equal(check(undefined), false);
    assert.equal(check('invalid'), false);
});
