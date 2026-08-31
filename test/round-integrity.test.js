import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sqlite3 from 'sqlite3';

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
let restoreDatabaseBackup;
let getGitUpdateDecision;

const openDatabase = () => new sqlite3.Database(path.join(temporaryDirectory, 'database.db'));

const run = (query, params = []) => new Promise((resolve, reject) => {
  const db = openDatabase();
  db.run(query, params, function onRun(error) {
    db.close();
    if (error) reject(error);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const get = (query, params = []) => new Promise((resolve, reject) => {
  const db = openDatabase();
  db.get(query, params, (error, row) => {
    db.close();
    if (error) reject(error);
    else resolve(row || null);
  });
});

const getFromDatabase = (databasePath, query, params = []) => new Promise((resolve, reject) => {
  const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
  db.get(query, params, (error, row) => {
    db.close();
    if (error) reject(error);
    else resolve(row || null);
  });
});

const exec = (query) => new Promise((resolve, reject) => {
  const db = openDatabase();
  db.exec(query, (error) => {
    db.close();
    if (error) reject(error);
    else resolve();
  });
});

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
  temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'sponsorenlauf-round-test-'));
  process.chdir(temporaryDirectory);

  await exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT NOT NULL,
      class_name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE students (
      id INTEGER PRIMARY KEY,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      geschlecht TEXT,
      klasse TEXT NOT NULL
    );
    CREATE TABLE replacements (id INTEGER PRIMARY KEY, studentID INTEGER);
    CREATE TABLE rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      student_id INTEGER NOT NULL
    );
    CREATE TABLE expected_donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE received_donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  ({ recordRound, RoundServiceError } = await import('../src/utils/roundService.js'));
  ({ deleteRoundById, deleteStudent } = await import('../src/utils/studentService.js'));
  ({ deleteData } = await import('../src/utils/dataDeletionService.js'));
  ({ default: studentHandler } = await import('../src/pages/api/students/[id].js'));
  ({ default: systemMaintenanceHandler } = await import('../src/pages/api/systemMaintenance.js'));
  ({ runDatabaseMigrations } = await import('../src/utils/migrationService.js'));
  ({ createDatabaseBackup, restoreDatabaseBackup } = await import('../src/utils/backupService.js'));
  ({ getGitUpdateDecision } = await import('../src/utils/updatePolicy.js'));
});

after(async () => {
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
    body: { action: 'update-and-restart' },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.payload.message, /„UPDATE“/);
});

test('a failed multi-type deletion rolls back earlier deletes', async () => {
  await createStudent(110);
  await recordRound({
    studentId: 110,
    scanId: 'scan_before_delete_rollback',
    doubleScanPrevention: { ...prevention, enabled: false },
    now: new Date('2026-08-31T10:25:00.000Z'),
  });

  // The minimal test database intentionally has no teachers table. The second
  // operation fails after rounds were deleted, so the transaction must restore them.
  await assert.rejects(
    deleteData({ types: ['rounds', 'teachers'], confirmation: 'LÖSCHEN' }),
    /no such table: teachers/
  );

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
  assert.equal((await getFromDatabase(backupPath, 'PRAGMA integrity_check')).integrity_check, 'ok');
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
  const roundColumns = await new Promise((resolve, reject) => {
    const db = openDatabase();
    db.all('PRAGMA table_info(rounds)', (error, rows) => {
      db.close();
      if (error) reject(error);
      else resolve(rows);
    });
  });

  assert.deepEqual(firstRun.applied, [1, 2, 3]);
  assert.deepEqual(secondRun.applied, []);
  assert.equal(versions.count, 3);
  assert.equal(versions.latest, 3);
  assert.equal(roundColumns.some((column) => column.name === 'scan_id'), true);
  assert.equal(roundColumns.some((column) => column.name === 'recorded_at'), true);
});

test('a verified startup snapshot can restore the live database', async () => {
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

test('startup update policy distinguishes current, fast-forward, and diverged revisions', () => {
  const current = 'a'.repeat(40);
  const available = 'b'.repeat(40);

  assert.equal(getGitUpdateDecision({
    currentCommit: current,
    availableCommit: current,
    canFastForward: false,
  }), 'up-to-date');
  assert.equal(getGitUpdateDecision({
    currentCommit: current,
    availableCommit: available,
    canFastForward: true,
  }), 'update');
  assert.equal(getGitUpdateDecision({
    currentCommit: current,
    availableCommit: available,
    canFastForward: false,
  }), 'diverged');
});
