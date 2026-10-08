import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatMailDate } from '../src/utils/mailDate.js';

test('mail dates use German summer/winter time even when the server runs in UTC', () => {
    const original = process.env.TZ;
    process.env.TZ = 'UTC';
    try {
        assert.match(formatMailDate(new Date('2026-10-05T12:14:00Z')), /5\. Oktober 2026.*14:14/);
        assert.match(formatMailDate(new Date('2026-12-05T12:14:00Z')), /5\. Dezember 2026.*13:14/);
        assert.match(formatMailDate(new Date('2026-03-29T00:30:00Z')), /01:30/);
        assert.match(formatMailDate(new Date('2026-03-29T01:30:00Z')), /03:30/);
    } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
    }
});
