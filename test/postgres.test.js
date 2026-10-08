import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import { postgresSql, postgresConfig, closePostgresPools, getPostgresPool } from '../src/utils/postgres.js';
import { importSqlite } from '../src/utils/sqliteImport.js';
import { dbAll, dbGet, dbRun } from '../src/utils/database.js';
import { recordRound } from '../src/utils/roundService.js';
import { createDatabaseBackup, restoreDatabaseBackup } from '../src/utils/backupService.js';
import { setSetting, getSetting } from '../src/utils/settingsService.js';
import { setExpectedDonation } from '../src/utils/donationService.js';
import { loadStudentsForStatistics } from '../src/utils/statisticsService.js';
import { getStudentDirectory, getStudentSummary } from '../src/utils/studentSummaryService.js';
import { writeTransition } from '../src/utils/migrationGate.js';
const execute = promisify(execFile);
const enabled = Boolean(process.env.TEST_DATABASE_URL);
if (!enabled && process.env.npm_lifecycle_event === 'test:postgres') throw new Error('TEST_DATABASE_URL is required for PostgreSQL integration tests');
let admin, directory, source, originalHash, database;
const prevention = { enabled: true, mode: 'confirm', timeThresholdMinutes: 5 };
const scan = (studentId, scanId, options = {}) => recordRound({ studentId, scanId, doubleScanPrevention: prevention, ...options });

test('SQL parameter conversion preserves literals, comments and quoted identifiers', () => {
    assert.equal(postgresSql("SELECT '?' AS value, ? AS roundCount, \"?\" -- ?\n WHERE studentID = ?"), "SELECT '?' AS value, $1 AS \"roundCount\", \"?\" -- ?\n WHERE \"studentID\" = $2");
});

test('application rejects SQLite configuration instead of opening a fallback database', () => {
    const previous = process.env.SPONSORENLAUF_DATABASE_BACKEND;
    try {
        process.env.SPONSORENLAUF_DATABASE_BACKEND = 'sqlite';
        assert.throws(() => postgresConfig(), /Application requires PostgreSQL/);
    } finally {
        if (previous === undefined) delete process.env.SPONSORENLAUF_DATABASE_BACKEND;
        else process.env.SPONSORENLAUF_DATABASE_BACKEND = previous;
    }
});

before(async () => {
    if (!enabled) return;
    directory = await mkdtemp(path.join(tmpdir(), 'sponsorenlauf-postgres-'));
    source = path.join(directory, 'source.db');
    admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    database = 'test_' + randomUUID().replaceAll('-', '');
    await admin.query(`CREATE DATABASE "${database}"`);
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.pathname = '/' + database;
    process.env.DATABASE_URL = url.toString();
    process.env.PGDATABASE = database;
    process.env.PGUSER = decodeURIComponent(url.username);
    process.env.PGPASSWORD = decodeURIComponent(url.password);
    process.env.PGHOST = url.hostname;
    process.env.PGPORT = url.port || '5432';
    process.env.SPONSORENLAUF_BACKUP_DIRECTORY = path.join(directory, 'backups');
    const env = { ...process.env, SPONSORENLAUF_SQLITE_IMPORT_PATH: source };
    for (const key of ['DATABASE_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGPASSWORD_FILE']) delete env[key];
    await execute(process.execPath, ['scripts/upgrade-sqlite-import.mjs'], { env });
    const sqlite = new sqlite3.Database(source);
    await new Promise((resolve, reject) => sqlite.exec(`
        INSERT INTO classes(grade, class_name) VALUES('5', '5a');
        WITH RECURSIVE ids(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM ids WHERE n<1500)
        INSERT INTO students(id, vorname, nachname, klasse) SELECT n, 'Test', 'Person '||n, '5a' FROM ids;
        INSERT INTO replacements(id, studentID) VALUES(5001, 1);
        INSERT INTO teachers(id, vorname, nachname, klasse) VALUES(1, 'Test', 'Lehrkraft', '5a');
        INSERT INTO received_donations(student_id, amount) VALUES(1, 12.345);
        WITH RECURSIVE laps(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM laps WHERE n<20)
        INSERT INTO rounds(student_id, timestamp) SELECT students.id, '2025-01-01 12:00:00' FROM students CROSS JOIN laps;
    `, error => error ? reject(error) : resolve()));
    await new Promise((resolve, reject) => sqlite.close(error => error ? reject(error) : resolve()));
    originalHash = createHash('sha256').update(await readFile(source)).digest('hex');
});
after(async () => {
    if (!enabled) return;
    delete process.env.SPONSORENLAUF_TRANSITION_FILE;
    await closePostgresPools();
    await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin.end();
    await rm(directory, { recursive: true, force: true });
});
const integration = (name, fn) => test(name, { skip: !enabled }, fn);
integration('imports and verifies 1500 students and 30000 rounds without changing SQLite', async (t) => {
    const manifest = await importSqlite(source);
    assert.equal(manifest.tables.students.count, 1500);
    assert.equal(manifest.tables.rounds.count, 30000);
    assert.equal(createHash('sha256').update(await readFile(source)).digest('hex'), originalHash);
    assert.equal((await dbGet('SELECT SUM(amount) AS total FROM received_donations')).total, 12.345);
    const first = await getStudentDirectory({ page: '0', sort: 'id' });
    const second = await getStudentDirectory({ page: '1', sort: 'id' });
    assert.equal(first.students.length, 200);
    assert.equal(first.total, 1500);
    assert.equal(first.filtered, 1500);
    assert.equal(first.nextId, 1501);
    assert.ok(first.students.every(student => student.roundCount === 20 && !('rounds' in student) && !('timestamps' in student)));
    assert.ok(second.students.every(student => !first.students.some(before => before.id === student.id)));
    const summary = await getStudentSummary(1);
    assert.equal(summary.roundCount, 20);
    assert.ok(summary.lastTimestamp);
    const matched = await getStudentDirectory({ page: '0', search: String(summary.vorname), klasse: summary.klasse, filter: 'with-rounds' });
    assert.ok(matched.students.some(student => student.id === summary.id));
    assert.equal((await getStudentDirectory({ page: '0', filter: 'no-rounds' })).filtered, 0);
    assert.equal((await getStudentDirectory({ view: 'ids' })).length, 1500);
    t.diagnostic(`1500-student/30000-lap fixture: first 200-student page is ${Buffer.byteLength(JSON.stringify(first))} bytes; no lap histories transmitted.`);
});
integration('repeated import is idempotent and identities continue after imported IDs', async () => {
    assert.equal((await importSqlite(source)).alreadyImported, true);
    const result = await scan(1, 'scan_identity_test');
    assert.equal(result.round.id, 30001);
    assert.equal(result.student.roundCount, 21);
});
integration('six stations serialize scans of the same person before the double-scan check', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, (_, index) => scan(2, `scan_same_person_${index}`)));
    assert.equal(results.filter(result => result.accepted).length, 1);
    assert.equal(results.filter(result => result.requiresConfirmation).length, 5);
});
integration('six stations record different people and preserve camelCase API fields', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, (_, index) => scan(10 + index, `scan_different_person_${index}`)));
    assert.ok(results.every(result => result.accepted && result.student.roundCount === 21));
});
integration('same scan identity commits exactly once across independent Node processes', async () => {
    const code = `import {recordRound} from './src/utils/roundService.js'; console.log(JSON.stringify(await recordRound({studentId:30,scanId:'scan_cross_process_identity',doubleScanPrevention:{enabled:false}})));`;
    const results = await Promise.all(Array.from({ length: 6 }, () => execute(process.execPath, ['--input-type=module', '-e', code], { env: process.env })));
    assert.equal(new Set(results.map(result => JSON.parse(result.stdout).round.id)).size, 1);
    assert.equal((await dbGet('SELECT COUNT(*) AS count FROM rounds WHERE student_id = ?', [30])).count, 21);
});
integration('a shared scan ID for different students conflicts without creating a second round', async () => {
    const results = await Promise.allSettled([scan(40, 'scan_conflicting_students'), scan(41, 'scan_conflicting_students')]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(results.find(result => result.status === 'rejected').reason.code, 'SCAN_ID_CONFLICT');
});
integration('PostgreSQL upserts, concurrent donation replacement and statistics retain numeric types', async () => {
    await setSetting('pg_test', 'first');
    await setSetting('pg_test', 'second');
    assert.equal(await getSetting('pg_test'), 'second');
    await Promise.all([setExpectedDonation(1, 10), setExpectedDonation(1, 20)]);
    const donations = await dbAll('SELECT amount FROM expected_donations WHERE student_id = ?', [1]);
    assert.equal(donations.length, 1);
    assert.equal(typeof donations[0].amount, 'number');
    assert.equal((await loadStudentsForStatistics()).length, 1500);
});
integration('failed transaction rolls back and pool connections remain usable', async () => {
    const { dbTransaction } = await import('../src/utils/database.js');
    await assert.rejects(dbTransaction(async db => {
        await db.query('DELETE FROM received_donations WHERE student_id = ?', [1]);
        throw new Error('injected failure');
    }), /injected failure/);
    assert.equal((await dbGet('SELECT COUNT(*) AS count FROM received_donations')).count, 1);
});
integration('dump restores through an isolated database and restores all data atomically', async () => {
    const backup = await createDatabaseBackup();
    assert.ok(backup.filename.endsWith('.dump'));
    await dbRun('DELETE FROM received_donations');
    await restoreDatabaseBackup(backup.backupPath);
    assert.equal((await dbGet('SELECT SUM(amount) AS total FROM received_donations')).total, 12.345);
});
integration('migration gate prevents writes and remains blocked after restart state', async () => {
    process.env.SPONSORENLAUF_TRANSITION_FILE = path.join(directory, 'transition.json');
    writeTransition({ phase: 'awaiting_update', requestId: 'test' });
    await assert.rejects(scan(80, 'scan_blocked_transition'), /Schreibzugriffe/);
    await assert.rejects(dbRun('DELETE FROM rounds'), /Schreibzugriffe/);
    writeTransition({ phase: 'completed' });
    assert.equal((await scan(80, 'scan_released_transition')).accepted, true);
    delete process.env.SPONSORENLAUF_TRANSITION_FILE;
});
integration('legacy SQLite restore replaces PostgreSQL data without changing the source', async () => {
    await restoreDatabaseBackup(source);
    assert.equal((await dbGet('SELECT COUNT(*) AS count FROM rounds')).count, 30000);
    assert.equal(createHash('sha256').update(await readFile(source)).digest('hex'), originalHash);
});
integration('restarting bootstrap after an interrupted updater never releases pending writes', async () => {
    const maintenance = path.join(directory, 'maintenance');
    const { mkdir } = await import('node:fs/promises');
    await mkdir(maintenance);
    const requestId = randomUUID();
    process.env.SPONSORENLAUF_TRANSITION_FILE = path.join(directory, 'interrupted.json');
    process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY = maintenance;
    writeTransition({ phase: 'awaiting_update', requestId, snapshot: source });
    await writeFile(path.join(maintenance, 'status.json'), JSON.stringify({ action: 'update', state: 'failed', requestId }));
    await execute(process.execPath, ['scripts/bootstrap-postgres.mjs'], { env: { ...process.env,
        SPONSORENLAUF_DATABASE_PATH: source, SPONSORENLAUF_BOOTSTRAP_INTERNAL: '1' } });
    const state = JSON.parse(await readFile(process.env.SPONSORENLAUF_TRANSITION_FILE, 'utf8'));
    assert.equal(state.phase, 'awaiting_update');
    await assert.rejects(scan(90, 'scan_interrupted_bootstrap'), /Schreibzugriffe/);
    delete process.env.SPONSORENLAUF_TRANSITION_FILE;
    delete process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
});
integration('foreign or corrupted SQLite input cannot replace a populated target', async () => {
    const bad = path.join(directory, 'invalid.db');
    await writeFile(bad, 'not a database');
    await assert.rejects(importSqlite(bad, { replace: true }));
    const foreign = path.join(directory, 'foreign.db');
    const sqlite = new sqlite3.Database(foreign);
    await new Promise((resolve, reject) => sqlite.exec('CREATE TABLE unrelated (id INTEGER PRIMARY KEY)', error => error ? reject(error) : resolve()));
    await new Promise((resolve, reject) => sqlite.close(error => error ? reject(error) : resolve()));
    await assert.rejects(restoreDatabaseBackup(foreign), /Keine gültige Sponsorenlauf-Datenbank/);
    assert.equal((await dbGet('SELECT COUNT(*) AS count FROM students')).count, 1500);
    assert.equal((await getPostgresPool().query('SELECT 1 AS n')).rows[0].n, 1);
});
