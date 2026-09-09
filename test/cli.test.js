import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(repository, 'scripts', 'cli.mjs');
const migrate = path.join(repository, 'initDB.js');
let directory;
let environment;

const run = (script, arguments_ = []) => spawnSync(process.execPath, [script, ...arguments_], {
    cwd: directory,
    env: environment,
    encoding: 'utf8',
});

before(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'sponsorenlauf-cli-test-'));
    environment = {
        ...process.env,
        APP_ENV: 'development',
        NODE_ENV: 'test',
        SPONSORENLAUF_DATABASE_PATH: path.join(directory, 'database.db'),
        SPONSORENLAUF_BACKUP_DIRECTORY: path.join(directory, 'backups'),
    };
    const result = run(migrate);
    assert.equal(result.status, 0, result.stderr);
});

after(async () => rm(directory, { recursive: true, force: true }));

test('CLI creates and verifies an application backup', () => {
    const created = run(cli, ['backup', 'create', '--json']);
    assert.equal(created.status, 0, created.stderr);
    const backup = JSON.parse(created.stdout);
    assert.match(backup.filename, /_cli_/);

    const verified = run(cli, ['backup', 'verify', backup.backupPath, '--json']);
    assert.equal(verified.status, 0, verified.stderr);
    assert.equal(JSON.parse(verified.stdout).valid, true);
});

test('CLI support bundle contains diagnostics but no database', () => {
    const result = run(cli, ['support-bundle', directory, '--json']);
    assert.equal(result.status, 0, result.stderr);
    const bundle = JSON.parse(result.stdout);
    const entries = new AdmZip(bundle.path).getEntries().map((entry) => entry.entryName);
    assert.deepEqual(entries.sort(), ['config-sanitized.json', 'diagnose.json', 'system.json']);
    assert.equal(entries.some((entry) => entry.endsWith('.db')), false);
});

test('CLI database check emits machine-readable status', () => {
    const result = run(cli, ['database', 'check', '--json']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).integrity_check, 'ok');
});
