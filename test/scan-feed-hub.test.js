import assert from 'node:assert/strict';
import { before, after, test as nodeTest } from 'node:test';
import pg from 'pg';
import { createTestDatabase } from './helpers/postgres.js';
import { dbRun } from '../src/utils/database.js';
import { getPostgresPool, postgresConfig } from '../src/utils/postgres.js';
import { runDatabaseMigrations } from '../src/utils/migrationService.js';
import { getRecentScans, publishScanError } from '../src/utils/scanFeedService.js';
import { createScanFeedHub } from '../src/utils/scanFeedHub.js';

const enabled = Boolean(process.env.TEST_DATABASE_URL);
const test = (name, fn) => nodeTest(name, { skip: !enabled }, fn);
let cleanup;
const waitFor = async (condition) => {
    const deadline = Date.now() + 7000;
    while (!condition()) {
        assert.ok(Date.now() < deadline, 'Live notification did not arrive');
        await new Promise(resolve => setTimeout(resolve, 20));
    }
};
before(async () => {
    if (!enabled) return;
    cleanup = await createTestDatabase();
    await runDatabaseMigrations();
    await dbRun("INSERT INTO classes (grade, class_name) VALUES ('5', '5a')");
    for (let id = 1; id <= 6; id++) {
        await dbRun("INSERT INTO students (id, vorname, nachname, klasse) VALUES (?, ?, 'Test', '5a')", [id, `Kind${id}`]);
        await dbRun('INSERT INTO rounds (student_id, timestamp, source_device_id) VALUES (?, ?, ?)',
            [id, new Date().toISOString(), `device_0${id}`]);
    }
});
after(async () => { await cleanup?.(); });

test('six scanner/display pairs share snapshots, stay idle and receive only committed relevant changes', async (t) => {
    const reads = [];
    const hub = createScanFeedHub({ readScans: async device => {
        reads.push(device);
        return getRecentScans(device);
    } });
    const snapshots = Array.from({ length: 12 }, () => []);
    const feedback = Array.from({ length: 12 }, () => []);
    const unsubscribe = [];
    const errors = [];
    try {
        unsubscribe.push(...await Promise.all(snapshots.map((messages, index) =>
            hub.subscribe(`device_0${Math.floor(index / 2) + 1}`, value => messages.push(JSON.parse(value)),
                error => errors.push(error), value => feedback[index].push(JSON.parse(value))))));
        assert.equal(reads.length, 6, 'Each pair must share one initial snapshot');
        await new Promise(resolve => setTimeout(resolve, 1200));
        assert.equal(reads.length, 6, 'Idle connections must not query the database every second');
        await publishScanError('device_01');
        await waitFor(() => feedback[0].length === 1 && feedback[1].length === 1);
        assert.ok(feedback[0][0].errorId);
        assert.ok(feedback.slice(2).every(messages => messages.length === 0), 'Errors stay with the paired device');
        assert.equal(reads.length, 6, 'Transient error feedback must not reload scan history');
        assert.ok(snapshots.every(messages => messages.length === 1), 'Errors do not create a round');

        // Independent writer represents another Next.js process, not an in-process callback.
        const writer = await getPostgresPool().connect();
        try {
            await writer.query('BEGIN');
            await writer.query("INSERT INTO rounds (student_id, timestamp, source_device_id) VALUES (1, $1, 'device_01')", [new Date().toISOString()]);
            await new Promise(resolve => setTimeout(resolve, 100));
            assert.equal(snapshots[0].length, 1, 'Uncommitted rounds must not be shown');
            await writer.query('ROLLBACK');
            await new Promise(resolve => setTimeout(resolve, 100));
            assert.equal(reads.length, 6, 'Rolled back rounds must not trigger a snapshot');

            const started = Date.now();
            await Promise.all(Array.from({ length: 6 }, (_, index) => dbRun(
                'INSERT INTO rounds (student_id, timestamp, source_device_id) VALUES (?, ?, ?)',
                [index + 1, new Date().toISOString(), `device_0${index + 1}`])));
            await waitFor(() => snapshots.every(messages => messages.at(-1).scans.length === 2));
            t.diagnostic(`12 subscribers received six concurrent committed scans in ${Date.now() - started} ms (local PostgreSQL).`);
            assert.equal(reads.length, 12, 'Six commits should refresh six scopes, not twelve connections');
            for (const messages of snapshots) assert.equal(messages.at(-1).scans[0].student.roundCount, 2);

            await dbRun("UPDATE students SET vorname = 'Neu' WHERE id = 1");
            await waitFor(() => snapshots[0].at(-1).scans[0].student.vorname === 'Neu');
            assert.equal(reads.length, 13, 'Editing one student must not refresh unrelated devices');
            assert.equal(snapshots[1].at(-1).scans[0].student.vorname, 'Neu');

            await dbRun('INSERT INTO rounds (student_id, timestamp, source_device_id) VALUES (1, ?, ?)',
                [new Date().toISOString(), 'device_02']);
            await waitFor(() => snapshots[0].at(-1).scans[0].student.roundCount === 3
                && snapshots[2].at(-1).scans[0].student.id === 1);

            // A manual round changes the count on any device that has shown this student.
            await dbRun('INSERT INTO rounds (student_id, timestamp) VALUES (1, ?)', [new Date().toISOString()]);
            await waitFor(() => snapshots[0].at(-1).scans[0].student.roundCount === 4
                && snapshots[2].at(-1).scans[0].student.roundCount === 4);
            await dbRun('DELETE FROM students WHERE id = 1');
            await waitFor(() => snapshots[0].at(-1).scans.length === 0
                && snapshots[2].at(-1).scans.every(scan => scan.student.id === 2));
            assert.equal(snapshots[1].at(-1).scans.length, 0);
            assert.equal(snapshots[2].at(-1).scans.length, 2);
            assert.deepEqual(errors, []);
        } finally { writer.release(); }
    } finally { unsubscribe.forEach(stop => stop()); }
});

test('listener reconnect and infrequent fallback recover missing changes and truncations', async () => {
    const snapshots = [];
    const clients = [];
    const errors = [];
    const hub = createScanFeedHub({ fallbackMs: 500, createClient: () => {
        const client = new pg.Client(postgresConfig());
        clients.push(client);
        return client;
    } });
    const stop = await hub.subscribe('device_02', value => snapshots.push(JSON.parse(value)), error => errors.push(error));
    try {
        await clients[0].query('UNLISTEN scan_feed_changed');
        await dbRun("UPDATE students SET vorname = 'Fallback' WHERE id = 2");
        await waitFor(() => snapshots.at(-1).scans[0].student.vorname === 'Fallback');
        await clients[0].end();
        await waitFor(() => clients.length === 2);
        await clients[1].query('SELECT 1');
        await dbRun("UPDATE students SET vorname = 'Reconnect' WHERE id = 2");
        await waitFor(() => snapshots.at(-1).scans[0].student.vorname === 'Reconnect');
        await dbRun('TRUNCATE rounds');
        await waitFor(() => snapshots.at(-1).scans.length === 0);
        assert.deepEqual(errors, []);
    } finally { stop(); }
});

test('a display receives one scan while sharing reads with its scanner and gets metadata invalidations', async () => {
    const { applyScanUpdate } = await import('../src/utils/scanFeedProtocol.js');
    for (let index = 0; index < 35; index++) await dbRun('INSERT INTO rounds (student_id, timestamp, source_device_id) VALUES (3, ?, ?)',
        [new Date().toISOString(), 'device_payload_scope']);
    const reads = [];
    const hub = createScanFeedHub({ readScans: async (device, limit) => { reads.push(limit); return getRecentScans(device, limit); } });
    const scanner = [];
    const display = [];
    const messages = [];
    const feedback = [];
    const errors = [];
    const stops = [];
    try {
        stops.push(await hub.subscribe('device_payload_scope', message => scanner.push(JSON.parse(message)), error => errors.push(error)));
        stops.push(await hub.subscribe('device_payload_scope', message => {
            const payload = JSON.parse(message);
            messages.push(payload);
            display.push(applyScanUpdate(display.at(-1) || [], payload));
        }, error => errors.push(error), message => feedback.push(JSON.parse(message)), { limit: 1, delta: true }));
        assert.equal(reads.length, 1, 'A later iPad subscriber reuses the scanner snapshot');
        assert.equal(scanner[0].scans.length, 30);
        assert.equal(display[0].length, 1);
        await dbRun('INSERT INTO rounds (student_id, timestamp, source_device_id) VALUES (3, ?, ?)', [new Date().toISOString(), 'device_payload_scope']);
        await waitFor(() => messages.length === 2);
        assert.equal(messages[1].type, 'patch');
        assert.equal(display[1].length, 1);
        assert.equal(display[1][0].student.roundCount, 36);
        assert.equal(reads.length, 2);
        await dbRun("INSERT INTO settings (key, value) VALUES ('payload-notify-test', 'true') ON CONFLICT(key) DO UPDATE SET value = excluded.value");
        await waitFor(() => feedback.some(event => event.settingsChanged));
        assert.equal(reads.length, 2, 'Settings invalidations must not query lap history');
        assert.deepEqual(errors, []);
    } finally { stops.forEach(stop => stop()); }
});
