import assert from 'node:assert/strict';
import { after, before, test as nodeTest } from 'node:test';
import { createTestDatabase } from './helpers/postgres.js';
import { dbRun, dbGet, dbAll } from '../src/utils/database.js';
import { getPostgresPool, postgresConfig, pgQuery } from '../src/utils/postgres.js';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { getRecentScans } from '../src/utils/scanFeedService.js';
import pg from 'pg';
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const test = (name, fn) => nodeTest(name, { skip: !enabled }, fn);
let cleanup;
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const originalWorkingDirectory = process.cwd();
let temporaryDirectory;
let recordRound;
let RoundServiceError;
let deleteRoundById;
let deleteStudent;
let studentHandler;
let deleteData;
let systemMaintenanceHandler;
let runDatabaseMigrations;
let createDatabaseBackup;
let deleteDatabaseBackup;
let restoreDatabaseBackup;
let verifyApplicationDatabaseBackup;
let getLatestSchemaVersion;
let setAdminPin;
let verifyAdminPin;
let createAdminSession;
let verifyAdminSessionToken;
let saveSmtpConfiguration;
let getSmtpConfiguration;

const run = dbRun;
const get = dbGet;
const getFromDatabase = async (databasePath, query, params = []) => {
  const name = 'inspect_' + randomUUID().replaceAll('-', '');
  const pool = getPostgresPool();
  await pool.query(`CREATE DATABASE "${name}"`);
  const config = postgresConfig();
  const url = new URL(config.connectionString); url.pathname = '/' + name;
  const staging = new pg.Pool({ connectionString: url.toString() });
  try {
    const container = process.env.SPONSORENLAUF_PG_TOOLS_CONTAINER;
    const args = ['--no-owner', '--no-privileges', '--exit-on-error', '--username', config.user, '--dbname', name];
    const child = execFile(container ? 'docker' : 'pg_restore', container
      ? ['exec', '-i', '-e', `PGPASSWORD=${config.password}`, container, 'pg_restore', ...args]
      : ['--host', config.host, '--port', String(config.port), ...args],
      { env: { ...process.env, PGPASSWORD: config.password } });
    const complete = new Promise((resolve, reject) => child.on('error', reject).on('exit', code => code === 0 ? resolve() : reject(new Error('Backup restore failed'))));
    child.stdin.end(await readFile(databasePath));
    await complete;
    return (await pgQuery(staging, query, params)).rows[0];
  } finally { await staging.end(); await pool.query(`DROP DATABASE "${name}" WITH (FORCE)`); }
};

const createStudent = async (id) => {
  await run(
    'INSERT INTO students (id, vorname, nachname, klasse, geschlecht) VALUES (?, ?, ?, ?, ?)',
    [id, `Vorname${id}`, `Nachname${id}`, '5a', 'männlich']
  );
};

const prevention = {
  enabled: true,
  timeThresholdMinutes: 5,
  mode: 'confirm',
};

before(async () => {
  if (!enabled) return;
  cleanup = await createTestDatabase();
  temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'sponsorenlauf-round-test-'));
  process.chdir(temporaryDirectory);

  ({ recordRound, RoundServiceError } = await import('../src/utils/roundService.js'));
  ({ deleteRoundById, deleteStudent } = await import('../src/utils/studentService.js'));
  ({ deleteData } = await import('../src/utils/dataDeletionService.js'));
  ({ default: studentHandler } = await import('../src/pages/api/students/[id].js'));
  ({ default: systemMaintenanceHandler } = await import('../src/pages/api/systemMaintenance.js'));
  ({ runDatabaseMigrations, getLatestSchemaVersion } = await import('../src/utils/migrationService.js'));
  ({
    createDatabaseBackup,
    deleteDatabaseBackup,
    restoreDatabaseBackup,
    verifyApplicationDatabaseBackup,
  } = await import('../src/utils/backupService.js'));
  ({
    setAdminPin,
    verifyAdminPin,
    createAdminSession,
    verifyAdminSessionToken,
  } = await import('../src/utils/adminAuthService.js'));
  ({ saveSmtpConfiguration, getSmtpConfiguration } = await import('../src/utils/smtpService.js'));
  await runDatabaseMigrations();
  await run("INSERT INTO classes (grade, class_name) VALUES ('5', '5a') ON CONFLICT (class_name) DO NOTHING");
  process.env.SPONSORENLAUF_BACKUP_DIRECTORY = path.join(temporaryDirectory, 'backups');
});

after(async () => {
  if (!enabled) return;
  await cleanup();
  process.chdir(originalWorkingDirectory);
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test('simultaneous laptops cannot both bypass double-scan prevention', async () => {
  await createStudent(101);
  const now = new Date('2026-08-31T10:00:00.000Z');

  const results = await Promise.all([
    recordRound({ studentId: 101, scanId: 'scan_concurrent_1', doubleScanPrevention: prevention, now }),
    recordRound({ studentId: 101, scanId: 'scan_concurrent_2', doubleScanPrevention: prevention, now }),
  ]);

  assert.equal(results.filter((result) => result.accepted).length, 1);
  assert.equal(results.filter((result) => result.requiresConfirmation).length, 1);
  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id = 101')).count, 1);
});

test('six simultaneous stations can record different students', async () => {
  const studentIds = [201, 202, 203, 204, 205, 206];
  for (const studentId of studentIds) await createStudent(studentId);
  const results = await Promise.all(studentIds.map((studentId, index) => recordRound({
    studentId,
    scanId: `scan_station_${index + 1}`,
    sourceDeviceId: `device_${index + 1}`,
    doubleScanPrevention: prevention,
  })));

  assert.equal(results.filter((result) => result.accepted).length, 6);
  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id BETWEEN 201 AND 206')).count, 6);
});

test('retrying a scan after a lost response is idempotent', async () => {
  await createStudent(102);
  const input = {
    studentId: 102,
    scanId: 'scan_retry_same_request',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:05:00.000Z'),
  };

  const first = await recordRound(input);
  const retry = await recordRound(input);

  assert.equal(first.accepted, true);
  assert.equal(retry.accepted, true);
  assert.equal(retry.idempotentReplay, true);
  assert.equal(retry.round.id, first.round.id);
  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id = 102')).count, 1);
});

test('a scan ID cannot be replayed for a different student', async () => {
  await createStudent(106);
  await createStudent(107);

  await recordRound({
    studentId: 106,
    scanId: 'scan_student_binding',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:07:00.000Z'),
  });

  await assert.rejects(
    recordRound({
      studentId: 107,
      scanId: 'scan_student_binding',
      doubleScanPrevention: { ...prevention, enabled: false },
      now: new Date('2026-08-31T10:08:00.000Z'),
    }),
    (error) => error instanceof RoundServiceError && error.code === 'SCAN_ID_CONFLICT'
  );

  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id = 107')).count, 0);
});

test('a legacy future timestamp does not block new server-timestamped scans forever', async () => {
  await createStudent(103);
  await run(
    'INSERT INTO rounds (timestamp, student_id) VALUES (?, ?)',
    ['2030-01-01T00:00:00.000Z', 103]
  );

  const result = await recordRound({
    studentId: 103,
    scanId: 'scan_after_future_round',
    doubleScanPrevention: prevention,
    now: new Date('2026-08-31T10:10:00.000Z'),
  });

  assert.equal(result.accepted, true);
  assert.equal(result.round.timestamp, '2026-08-31T10:10:00.000Z');
});

test('deleting one round by ID preserves rounds appended by other clients', async () => {
  await createStudent(104);
  const first = await recordRound({
    studentId: 104,
    scanId: 'scan_delete_target',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:15:00.000Z'),
  });
  const second = await recordRound({
    studentId: 104,
    scanId: 'scan_delete_preserve',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:16:00.000Z'),
  });

  await deleteRoundById(first.round.id, 104);

  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id = 104')).count, 1);
  assert.equal((await get('SELECT id FROM rounds WHERE student_id = 104')).id, second.round.id);
});

test('stale profile payloads cannot replace the server round history', async () => {
  await createStudent(105);
  await recordRound({
    studentId: 105,
    scanId: 'scan_profile_guard',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:20:00.000Z'),
  });

  const response = {
    statusCode: 200,
    payload: null,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await studentHandler({
    method: 'PUT',
    query: { id: '105' },
    body: {
      vorname: 'Geändert',
      timestamps: [],
    },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id = 105')).count, 1);
});

test('bulk deletion is rejected without the exact confirmation phrase', async () => {
  await createStudent(108);

  await assert.rejects(
    deleteData({ types: ['students'], confirmation: 'yes' }),
    /exakt „LÖSCHEN“/
  );

  assert.equal((await get('SELECT COUNT(*) AS count FROM students WHERE id = 108')).count, 1);
});

test('individual student deletion creates a private recovery snapshot', async () => {
  await createStudent(111);
  await recordRound({
    studentId: 111,
    scanId: 'scan_before_student_delete',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:22:00.000Z'),
  });

  const result = await deleteStudent(111);
  const backupPath = path.join(temporaryDirectory, 'backups', result.backupFilename);
  const backupStats = await stat(backupPath);

  assert.equal((await get('SELECT COUNT(*) AS count FROM students WHERE id = 111')).count, 0);
  assert.equal((await getFromDatabase(
    backupPath,
    'SELECT COUNT(*) AS count FROM rounds WHERE student_id = 111'
  )).count, 1);
  assert.equal(backupStats.mode & 0o777, 0o600);
});

test('system update/restart rejects requests without explicit confirmation', async () => {
  const response = {
    statusCode: 200,
    payload: null,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await systemMaintenanceHandler({
    method: 'POST',
    body: { action: 'update' },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.payload.message, /„UPDATE“/);
});

test('production maintenance requests are queued for the restricted host agent', async () => {
  const previousEnvironment = process.env.APP_ENV;
  const previousDirectory = process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
  const maintenanceDirectory = path.join(temporaryDirectory, 'maintenance');
  process.env.APP_ENV = 'production';
  process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = maintenanceDirectory;

  const response = {
    statusCode: 200,
    payload: null,
    setHeader() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  try {
    await systemMaintenanceHandler({
      method: 'POST',
      body: { action: 'update', confirmation: 'UPDATE' },
    }, response);
  } finally {
    if (previousEnvironment === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = previousEnvironment;
    if (previousDirectory === undefined) delete process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
    else process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = previousDirectory;
  }

  assert.equal(response.statusCode, 202);
  const requestFile = (await readdir(maintenanceDirectory)).find((name) => name.endsWith('.request'));
  assert.ok(requestFile);
  assert.equal((await readFile(path.join(maintenanceDirectory, requestFile), 'utf8')).trim(), 'update');
});

test('a failed multi-type deletion rolls back earlier deletes', async () => {
  await createStudent(110);
  await recordRound({
    studentId: 110,
    scanId: 'scan_before_delete_rollback',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:25:00.000Z'),
  });

  await getPostgresPool().query(`
    CREATE FUNCTION reject_teacher_delete() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'injected deletion failure'; END $$;
    CREATE TRIGGER reject_teacher_delete BEFORE DELETE ON teachers FOR EACH STATEMENT EXECUTE FUNCTION reject_teacher_delete();
  `);
  try {
    await assert.rejects(deleteData({ types: ['rounds', 'teachers'], confirmation: 'LÖSCHEN' }), /injected deletion failure/);
  } finally {
    await getPostgresPool().query('DROP TRIGGER reject_teacher_delete ON teachers; DROP FUNCTION reject_teacher_delete()');
  }

  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id = 110')).count, 1);
});

test('bulk deletion creates a verified recovery snapshot before one atomic delete', async () => {
  await createStudent(109);
  await run('INSERT INTO replacements (id, studentID) VALUES (?, ?)', [9001, 109]);
  await recordRound({
    studentId: 109,
    scanId: 'scan_before_bulk_delete',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:30:00.000Z'),
  });

  const result = await deleteData({
    types: ['students'],
    confirmation: 'LÖSCHEN',
  });
  const backupPath = path.join(temporaryDirectory, 'backups', result.backupFilename);

  assert.equal((await get('SELECT COUNT(*) AS count FROM students')).count, 0);
  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds')).count, 0);
  assert.equal((await get('SELECT COUNT(*) AS count FROM replacements')).count, 0);
  await verifyApplicationDatabaseBackup(backupPath);
  assert.equal((await getFromDatabase(
    backupPath,
    'SELECT COUNT(*) AS count FROM students WHERE id = 109'
  )).count, 1);
  assert.equal((await getFromDatabase(
    backupPath,
    'SELECT COUNT(*) AS count FROM rounds WHERE student_id = 109'
  )).count, 1);
});

test('versioned migrations upgrade an existing database exactly once', async () => {
  const firstRun = await runDatabaseMigrations();
  const secondRun = await runDatabaseMigrations();
  const versions = await get('SELECT COUNT(*) AS count, MAX(version) AS latest FROM schema_migrations');
  const roundColumns = await dbAll("SELECT column_name AS name FROM information_schema.columns WHERE table_name = 'rounds'");

  const latestVersion = getLatestSchemaVersion();
  assert.deepEqual(firstRun.applied, []);
  assert.deepEqual(secondRun.applied, []);
  assert.equal(versions.count, latestVersion);
  assert.equal(versions.latest, latestVersion);
  assert.equal(roundColumns.some((column) => column.name === 'scan_id'), true);
  assert.equal(roundColumns.some((column) => column.name === 'recorded_at'), true);
});

test('scanner migration copies legacy device rules without overwriting existing rules or historical rounds', async () => {
  const setting = await get("SELECT value FROM settings WHERE key = 'module_config'");
  const devices = ['migration_legacy_device', 'migration_own_device'];
  try {
    await run('DELETE FROM schema_migrations WHERE version = 11');
    await run(`INSERT INTO scanner_stations (id, name, mode, classes, grades) VALUES
      ('default', 'Standard-Scanner', 'allow', '[]', '[]'),
      ('migration_legacy_station', 'Eingang', 'block', '["5a"]', '[]'),
      ('rules_migration_own_device', 'Scanner-Regeln', 'warn', '[]', '["6"]')`);
    for (const device of devices) {
      await run('INSERT INTO scan_devices(device_id) VALUES (?)', [device]);
      await run(`INSERT INTO station_activity(device_id, source_station_id, last_seen_at)
        VALUES (?, 'migration_legacy_station', ?)`, [device, new Date().toISOString()]);
    }
    await run(`INSERT INTO settings(key, value) VALUES ('module_config', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [JSON.stringify({ scannerStations: true, roundDisplay: false, donations: true })]);
    const before = await dbAll('SELECT id, timestamp, source_station_id, source_station_name FROM rounds ORDER BY id');
    assert.deepEqual((await runDatabaseMigrations()).applied, [11]);
    assert.equal(await get("SELECT id FROM scanner_stations WHERE id = 'default'"), null);
    assert.equal((await get("SELECT mode FROM scanner_stations WHERE id = 'rules_migration_legacy_device'")).mode, 'block');
    assert.equal((await get("SELECT mode FROM scanner_stations WHERE id = 'rules_migration_own_device'")).mode, 'warn');
    assert.deepEqual(JSON.parse((await get("SELECT value FROM settings WHERE key = 'module_config'")).value), { roundDisplay: false, donations: true });
    assert.deepEqual(await dbAll('SELECT id, timestamp, source_station_id, source_station_name FROM rounds ORDER BY id'), before);
    assert.deepEqual((await runDatabaseMigrations()).applied, []);
  } finally {
    for (const device of devices) {
      await run('DELETE FROM station_activity WHERE device_id = ?', [device]);
      await run('DELETE FROM scan_devices WHERE device_id = ?', [device]);
      await run('DELETE FROM scanner_stations WHERE id = ?', ['rules_' + device]);
    }
    await run("DELETE FROM scanner_stations WHERE id IN ('default', 'migration_legacy_station')");
    if (setting) await run("UPDATE settings SET value = ? WHERE key = 'module_config'", [setting.value]);
    else await run("DELETE FROM settings WHERE key = 'module_config'");
  }
});

test('Microsoft Graph credentials are encrypted and secrets are never returned to the browser', async () => {
  const clientSecret = 'microsoft-test-secret-value';
  const saved = await saveSmtpConfiguration({
    provider: 'microsoft',
    tenantId: '11111111-1111-4111-8111-111111111111',
    clientId: '22222222-2222-4222-8222-222222222222',
    clientSecret,
    fromAddress: 'sv@example.org',
    fromName: 'Schülervertretung',
  });
  const row = await get('SELECT provider, client_secret_encrypted FROM smtp_configuration WHERE id = 1');

  assert.equal(saved.provider, 'microsoft');
  assert.equal(saved.clientSecretConfigured, true);
  assert.equal(saved.clientSecret, undefined);
  assert.equal(row.provider, 'microsoft');
  assert.notEqual(row.client_secret_encrypted, clientSecret);
  assert.equal(row.client_secret_encrypted.includes(clientSecret), false);

  const internal = await getSmtpConfiguration({ includePassword: true });
  assert.equal(internal.clientSecret, clientSecret);
});

test('administrator setup is atomic and sessions are validated server-side', async () => {
  const setupResults = await Promise.allSettled([
    setAdminPin('246810'),
    setAdminPin('135791'),
  ]);
  assert.equal(setupResults.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(setupResults.filter((result) => result.status === 'rejected').length, 1);
  const winningPin = await verifyAdminPin('246810') ? '246810' : '135791';
  await setAdminPin('246810', { requireExisting: true });
  assert.ok(winningPin);
  assert.equal(await verifyAdminPin('246810'), true);
  assert.equal(await verifyAdminPin('135791'), false);

  const credential = await get('SELECT pin_hash, pin_salt FROM admin_credentials WHERE id = 1');
  assert.notEqual(credential.pin_hash, '246810');
  assert.ok(credential.pin_salt);

  const session = await createAdminSession();
  assert.equal(await verifyAdminSessionToken(session.token), true);
  assert.equal(await verifyAdminSessionToken('invalid-session-token'), false);
  assert.equal((await get('SELECT COUNT(*) AS count FROM admin_sessions WHERE token_hash = ?', [session.token])).count, 0);
});

test('complete reset clears application data but preserves the admin PIN and recovery backups', async () => {
  await run('INSERT INTO classes (grade, class_name) VALUES (?, ?) ON CONFLICT (class_name) DO NOTHING', ['5', '5a']);
  await createStudent(113);
  await run(
    'INSERT INTO teachers (id, vorname, nachname, klasse, email) VALUES (?, ?, ?, ?, ?)',
    [113, 'Test', 'Lehrkraft', '5a', 'test@example.org']
  );
  await recordRound({
    studentId: 113,
    scanId: 'scan_before_full_reset',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:45:00.000Z'),
  });
  await run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', ['setup_completed', 'true']);
  await run(
    'INSERT INTO station_activity (device_id, last_seen_at, scan_count) VALUES (?, ?, ?)',
    ['reset-test-station', new Date().toISOString(), 1]
  );

  await assert.rejects(
    deleteData({ types: ['fullReset'], confirmation: 'LÖSCHEN' }),
    /exakt „ALLES LÖSCHEN“/
  );
  await assert.rejects(
    deleteData({ types: ['fullReset', 'students'], confirmation: 'ALLES LÖSCHEN' }),
    /nicht mit anderen Löschoptionen kombiniert/
  );

  const result = await deleteData({
    types: ['fullReset'],
    confirmation: 'ALLES LÖSCHEN',
  });
  const backupPath = path.join(temporaryDirectory, 'backups', result.backupFilename);

  assert.equal(result.fullReset, true);
  for (const table of [
    'students',
    'teachers',
    'classes',
    'rounds',
    'replacements',
    'expected_donations',
    'received_donations',
    'settings',
    'smtp_configuration',
    'station_activity',
    'admin_login_attempts',
  ]) {
    assert.equal((await get(`SELECT COUNT(*) AS count FROM ${table}`)).count, 0);
  }
  assert.equal(await verifyAdminPin('246810'), true);
  await verifyApplicationDatabaseBackup(backupPath);
  assert.equal((await getFromDatabase(
    backupPath,
    'SELECT COUNT(*) AS count FROM students WHERE id = 113'
  )).count, 1);
});

test('a verified startup snapshot can restore the live database', async () => {
  await run("INSERT INTO classes (grade, class_name) VALUES ('5', '5a') ON CONFLICT (class_name) DO NOTHING");
  await createStudent(112);
  await recordRound({
    studentId: 112,
    scanId: 'scan_before_restore_test',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:40:00.000Z'),
  });
  const backup = await createDatabaseBackup({ reason: 'restore-test' });

  await run('DELETE FROM rounds WHERE student_id = 112');
  await run('DELETE FROM students WHERE id = 112');
  await restoreDatabaseBackup(backup.backupPath);

  assert.equal((await get('SELECT COUNT(*) AS count FROM students WHERE id = 112')).count, 1);
  assert.equal((await get('SELECT COUNT(*) AS count FROM rounds WHERE student_id = 112')).count, 1);
});

test('a stored backup can be deleted without allowing path traversal', async () => {
  const backup = await createDatabaseBackup({ reason: 'delete-test' });

  assert.deepEqual(await deleteDatabaseBackup(backup.filename), { filename: backup.filename });
  await assert.rejects(stat(backup.backupPath), { code: 'ENOENT' });
  await assert.rejects(deleteDatabaseBackup('../database.db'), /Ungültiger Backup-Dateiname/);
});

test('scan feeds isolate devices, stay bounded, and reflect student edits and round deletion', async () => {
  await createStudent(114);
  for (let index = 0; index < 32; index += 1) {
    await recordRound({ studentId: 114, scanId: `feed_scan_${index}`, sourceDeviceId: 'device_feed_one',
      doubleScanPrevention: { ...prevention, enabled: false },
      now: new Date(Date.UTC(2026, 9, 6, 10, index)) });
  }
  await recordRound({ studentId: 114, scanId: 'feed_other_device', sourceDeviceId: 'device_feed_two',
    doubleScanPrevention: { ...prevention, enabled: false }, now: new Date('2026-10-06T11:00:00Z') });
  const deviceFeed = await getRecentScans('device_feed_one');
  assert.equal(deviceFeed.length, 30);
  assert.equal(deviceFeed[0].timestamp, '2026-10-06T10:31:00.000Z');
  assert.equal(deviceFeed[0].previousTimestamp, '2026-10-06T10:30:00.000Z');
  assert.equal(deviceFeed[0].student.roundCount, 33);
  assert.deepEqual(deviceFeed.map(scan => scan.roundNumber), Array.from({ length: 30 }, (_, index) => 32 - index));
  assert.ok(deviceFeed.every(scan => scan.deviceId === 'device_feed_one'));
  assert.equal((await getRecentScans())[0].deviceId, 'device_feed_two');
  assert.equal((await getRecentScans())[0].roundNumber, 33);
  await run('UPDATE students SET vorname = ? WHERE id = ?', ['Changed', 114]);
  await deleteRoundById(deviceFeed[0].id, 114);
  const updated = await getRecentScans('device_feed_one');
  assert.equal(updated[0].student.vorname, 'Changed');
  assert.equal(updated[0].student.roundCount, 32);
  assert.equal(updated[0].roundNumber, 31);
  assert.ok(updated.every(scan => scan.id !== deviceFeed[0].id));
  assert.deepEqual(await getRecentScans('device_not_used'), []);
});
