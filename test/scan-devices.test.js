import assert from 'node:assert/strict';
import { before, after, test as nodeTest } from 'node:test';
import { createTestDatabase } from './helpers/postgres.js';
import { runDatabaseMigrations } from '../src/utils/migrationService.js';
import { dbRun } from '../src/utils/database.js';
import { recordStationHeartbeat } from '../src/utils/stationService.js';
import { getScanDevices, getScanDevice, renameScanDevice } from '../src/utils/scanDeviceService.js';
import { createScanFeedHub } from '../src/utils/scanFeedHub.js';
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const test = (name, fn) => nodeTest(name, { skip: !enabled }, fn);
let cleanup;
before(async () => {
    if (!enabled) return;
    cleanup = await createTestDatabase();
    await runDatabaseMigrations();
});
after(async () => { await cleanup?.(); });

test('named laptops register independently, keep stable identities and expose only active devices or the selected offline laptop', async () => {
    await Promise.all(Array.from({ length: 6 }, (_, index) => recordStationHeartbeat(`device_registry_${index}`)));
    const devices = await getScanDevices();
    assert.equal(devices.length, 6);
    assert.equal(new Set(devices.map(device => device.number)).size, 6);
    assert.ok(devices.every(device => device.online && /^Scanner \d+$/.test(device.name)));
    const original = await getScanDevice('device_registry_0');
    await renameScanDevice(original.id, 'Eingang links');
    await dbRun("UPDATE station_activity SET last_seen_at = '2000-01-01T00:00:00.000Z' WHERE device_id = ?", [original.id]);
    assert.equal((await getScanDevices()).length, 5);
    const selected = (await getScanDevices(original.id)).find(device => device.id === original.id);
    assert.equal(selected.name, 'Eingang links');
    assert.equal(selected.online, false);
    await dbRun('DELETE FROM station_activity WHERE device_id = ?', [original.id]);
    await recordStationHeartbeat(original.id);
    const returned = await getScanDevice(original.id);
    assert.equal(returned.name, 'Eingang links');
    assert.equal(returned.number, original.number, 'Telemetry cleanup must not change a device name or number');
    assert.equal(returned.online, true);

    await dbRun("INSERT INTO scanner_stations (id, name) VALUES ('registry_station', 'Jahrgang 5')");
    await recordStationHeartbeat(original.id, { stationId: 'registry_station' });
    const second = devices.find(device => device.id !== original.id);
    await recordStationHeartbeat(second.id, { stationId: 'registry_station' });
    assert.ok((await getScanDevices()).every(device => !Object.hasOwn(device, 'stationName')));
    assert.equal(await renameScanDevice('device_unknown', 'Unbekannt'), null);
});

test('renaming a laptop reaches its display through SSE without creating or refreshing rounds', async () => {
    const feedback = [];
    let reads = 0;
    const errors = [];
    const hub = createScanFeedHub({ readScans: async () => { reads++; return []; } });
    const stop = await hub.subscribe('device_registry_0', () => {}, error => errors.push(error), value => feedback.push(JSON.parse(value)));
    try {
        await renameScanDevice('device_registry_0', 'Ziel links');
        for (let retry = 0; retry < 100 && !feedback.length; retry++) await new Promise(resolve => setTimeout(resolve, 20));
        assert.equal(feedback[0]?.device.name, 'Ziel links');
        assert.equal(feedback[0]?.device.id, 'device_registry_0');
        assert.equal(reads, 1);
        assert.deepEqual(errors, []);
    } finally { stop(); }
});
