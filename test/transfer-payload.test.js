import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeScanUpdate, applyScanUpdate } from '../src/utils/scanFeedProtocol.js';
import { packStatistics, unpackStatistics } from '../src/utils/statisticsProtocol.js';

const sample = (id, count = 30) => ({ id, timestamp: '2026-10-07T09:00:00.000Z', previousTimestamp: '2026-10-07T08:50:00.000Z',
    deviceId: 'device_transfer_test', stationName: 'Ziel links',
    student: { id: 1, vorname: 'Anna', nachname: 'Mustermann', klasse: '5a', roundCount: count } });

test('live patches transport names once, preserve order, corrections and removals, and reduce repeated histories', t => {
    const before = Array.from({ length: 30 }, (_, index) => sample(30 - index));
    const initial = encodeScanUpdate(null, before);
    assert.equal(initial.students.length, 1);
    assert.deepEqual(applyScanUpdate([], initial), before);
    const next = [sample(31, 31), ...before.slice(0, 29).map(scan => ({ ...scan, student: { ...scan.student, roundCount: 31 } }))];
    const patch = encodeScanUpdate(before, next);
    assert.equal(patch.changes.length, 1);
    assert.equal(patch.students.length, 1);
    assert.deepEqual(patch.remove, [1]);
    assert.deepEqual(applyScanUpdate(before, patch), next);
    assert.equal(encodeScanUpdate(next, next), null);
    const size = Buffer.byteLength(JSON.stringify(patch));
    const full = Buffer.byteLength(JSON.stringify({ scans: next }));
    assert.ok(size < full / 5, 'A new scan should not resend a complete history');
    t.diagnostic(`Representative 30-scan update: ${full} bytes as full history, ${size} bytes as patch.`);
    const edited = next.map(scan => ({ ...scan, student: { ...scan.student, vorname: 'Anne' } }));
    assert.deepEqual(applyScanUpdate(next, encodeScanUpdate(next, edited)), edited);
    assert.deepEqual(applyScanUpdate(edited, encodeScanUpdate(edited, [])), []);
    assert.deepEqual(applyScanUpdate(edited, encodeScanUpdate(null, before)), before, 'Reconnection replaces stale state');
});

test('statistics share students across rankings without changing their meaning', () => {
    const student = { id: 1, vorname: 'Anna', nachname: 'Mustermann', klasse: '5a', rounds: 30, spenden: 10 };
    const statistics = { rawStudents: [student], topStudentsByRounds: [student], genderBreakdown: [{ gender: 'weiblich', topRoundStudent: student }], totalRounds: 30 };
    const packed = packStatistics(statistics);
    assert.equal(packed.students.length, 1);
    assert.deepEqual(unpackStatistics(packed), statistics);
    assert.ok(JSON.stringify(packed).length < JSON.stringify(statistics).length);
});
