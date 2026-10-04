#!/usr/bin/env node
// Run explicitly with built new and old images. All containers, networks and
// volumes use a random test project; production resources are never selected.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { snapshotSqlite } from '../src/utils/sqliteImport.js';
const execute = promisify(execFile);
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'sponsorenlauf-legacy-update-'));
const project = 'migrationtest' + randomUUID().replaceAll('-', '').slice(0, 12);
const image = `ghcr.io/florian2807/sponsorenlauf-tool:${project}`;
const oldImage = process.env.TEST_LEGACY_IMAGE || 'sponsorenlauf-tool:production-verification';
const newImage = process.env.TEST_APPLICATION_IMAGE || 'sponsorenlauf-postgres-test';
const composeFile = path.join(directory, 'compose.prod.yaml');
const docker = (...args) => execute('docker', args, { maxBuffer: 8 * 1024 * 1024 });
const compose = (...args) => docker('compose', '-p', project, '-f', composeFile, ...args);
const data = path.join(directory, 'data');
const maintenance = path.join(directory, 'maintenance');
const json = value => JSON.stringify(value);
try {
    await fs.mkdir(path.join(data, 'backups'), { recursive: true });
    await fs.mkdir(maintenance);
    await fs.chmod(data, 0o777);
    await fs.chmod(path.join(data, 'backups'), 0o777);
    await fs.chmod(maintenance, 0o777);
    await snapshotSqlite(path.resolve('database.db'), path.join(data, 'database.db'));
    await fs.chmod(path.join(data, 'database.db'), 0o666);
    const oldCompose = `services:
  app:
    image: ${image}
    ports: ["127.0.0.1::3000"]
    environment:
      SPONSORENLAUF_DATABASE_PATH: /data/database.db
      SPONSORENLAUF_BACKUP_DIRECTORY: /data/backups
      SPONSORENLAUF_SECRET_KEY: migration-test-secret
      SPONSORENLAUF_MAINTENANCE_DIRECTORY: /maintenance
    volumes:
      - ${json(data + ':/data')}
      - ${json(maintenance + ':/maintenance')}
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/api/setupStatus').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 1s
      timeout: 5s
      start_period: 1s
      retries: 5
`;
    await fs.writeFile(path.join(directory, 'old.yaml'), oldCompose);
    const newCompose = oldCompose.replace('    environment:\n', `    depends_on:
      database:
        condition: service_healthy
    environment:
      SPONSORENLAUF_DATABASE_BACKEND: postgres
      PGHOST: database
      PGUSER: sponsorenlauf
      PGDATABASE: sponsorenlauf
      PGPASSWORD_FILE: /credentials/password
      SPONSORENLAUF_TRANSITION_FILE: /data/postgres-transition.json
`).replace('    volumes:\n', '    volumes:\n      - credentials:/credentials:ro\n') + `
  database:
    image: postgres:18-bookworm
    entrypoint: ["bash", "/bootstrap/start-postgres.sh"]
    environment:
      POSTGRES_USER: sponsorenlauf_owner
      POSTGRES_DB: sponsorenlauf
    volumes:
      - database-data:/var/lib/postgresql
      - credentials:/credentials
      - ${json(path.resolve('deployment/start-postgres.sh') + ':/bootstrap/start-postgres.sh:ro')}
      - ${json(path.resolve('deployment/init-postgres.sh') + ':/docker-entrypoint-initdb.d/10-application.sh:ro')}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U sponsorenlauf_owner -d sponsorenlauf"]
      interval: 1s
      timeout: 5s
      retries: 30
volumes:
  database-data:
  credentials:
`;
    const failingHealth = process.env.TEST_FORCE_HEALTH_FAILURE === '1';
    const candidate = failingHealth
        ? newCompose.replace("fetch('http://127.0.0.1:3000/api/setupStatus').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))", "process.exit(1)")
        : newCompose;
    await fs.writeFile(path.join(directory, 'new.yaml'), candidate);
    await fs.copyFile(path.join(directory, 'old.yaml'), composeFile);
    await docker('tag', oldImage, image);
    await compose('up', '-d', '--wait');
    await fs.writeFile(path.join(directory, 'production.env'), `SPONSORENLAUF_IMAGE_TAG=${project}\n`);
    await fs.writeFile(path.join(maintenance, 'update.log'), '');
    await fs.writeFile(path.join(maintenance, 'progress.log'), '');
    const shell = `#!/bin/bash
set -uo pipefail
source "$TEST_AGENT_FIXTURE"
chown() { :; }
stat() { id -un; }
preflight_update() { docker info >/dev/null; }
docker_compose() {
  if [ "\${1:-}" = pull ]; then return 0; fi
  docker compose -p "$TEST_PROJECT" -f "$REPO_DIR/compose.prod.yaml" "$@"
}
sudo() {
  shift 2
  if [ "$1" != git ]; then "$@"; return; fi
  shift 3
  case "$1" in
    status) return 0 ;;
    rev-parse) if [ -f "$REPO_DIR/pulled" ]; then echo postgres-migration-test; else echo legacy-image; fi ;;
    branch) echo main ;;
    pull)
      # A round commits AFTER the old updater's initial backup.
      docker_compose exec -T app node -e "import('./src/utils/database.js').then(async({dbGet,dbRun})=>{const s=await dbGet('SELECT id FROM students LIMIT 1');await dbRun('INSERT INTO rounds(student_id,timestamp) VALUES(?,?)',[s.id,new Date().toISOString()])})" || return 1
      cp "$REPO_DIR/new.yaml" "$REPO_DIR/compose.prod.yaml"
      docker tag "$TEST_NEW_IMAGE" "$TEST_IMAGE_REFERENCE"
      touch "$REPO_DIR/pulled" ;;
    reset) docker_compose logs --tail 60 app >> "$RAW_LOG_FILE" 2>&1; cp "$REPO_DIR/old.yaml" "$REPO_DIR/compose.prod.yaml" ;;
    *) echo "Unexpected git command: $*" >&2; return 1 ;;
  esac
}
run_update "$TEST_REQUEST_ID"
`;
    const filename = path.join(directory, 'run.sh');
    await fs.writeFile(filename, shell);
    const env = { ...process.env, SPONSORENLAUF_REPO_DIR: directory,
        SPONSORENLAUF_MAINTENANCE_DIRECTORY: maintenance, SPONSORENLAUF_PRODUCTION_ENV: path.join(directory, 'production.env'),
        TEST_AGENT_FIXTURE: path.resolve('test/fixtures/legacy-maintenance-agent.sh'), TEST_PROJECT: project,
        TEST_NEW_IMAGE: newImage, TEST_IMAGE_REFERENCE: image, TEST_REQUEST_ID: randomUUID() };
    try { await execute('bash', [filename], { env, timeout: 180000, maxBuffer: 8 * 1024 * 1024 }); }
    catch (error) { if (!failingHealth) throw error; }
    const status = JSON.parse(await fs.readFile(path.join(maintenance, 'status.json'), 'utf8'));
    assert.equal(status.state, failingHealth ? 'rolled_back' : 'succeeded');
    const state = JSON.parse(await fs.readFile(path.join(data, 'postgres-transition.json'), 'utf8'));
    assert.ok(['awaiting_update', 'completed'].includes(state.phase));
    const count = await compose('exec', '-T', 'app', 'node', '-e', "import('./src/utils/database.js').then(async({dbGet})=>console.log(JSON.stringify(await dbGet('SELECT COUNT(*) AS count FROM rounds'))))");
    const sqlite = await import('sqlite3');
    const source = new sqlite.default.Database(path.resolve('database.db'), sqlite.default.OPEN_READONLY);
    const before = await new Promise((resolve, reject) => source.get('SELECT COUNT(*) AS count FROM rounds', (error, row) => error ? reject(error) : resolve(row.count)));
    await new Promise(resolve => source.close(resolve));
    assert.equal(JSON.parse(count.stdout).count, before + 1);
    const rollback = path.join(data, 'backups', state.rollbackBackup);
    const rollbackDb = new sqlite.default.Database(rollback, sqlite.default.OPEN_READONLY);
    const saved = await new Promise((resolve, reject) => rollbackDb.get('SELECT COUNT(*) AS count FROM rounds', (error, row) => error ? reject(error) : resolve(row.count)));
    await new Promise(resolve => rollbackDb.close(resolve));
    assert.equal(saved, before + 1);
    console.log(failingHealth ? 'Legacy updater rolled back a failed PostgreSQL start without losing the late round.' : 'Unmodified legacy updater migrated directly to PostgreSQL; the late round is present in both target and rollback snapshot.');
} catch (error) {
    console.error(error.message);
    try { console.error((await compose('logs', '--tail', '40')).stdout); } catch {}
    try { console.error(await fs.readFile(path.join(maintenance, 'update.log'), 'utf8')); } catch {}
    process.exitCode = 1;
} finally {
    await docker('compose', '-p', project, '-f', path.join(directory, 'new.yaml'), 'down', '--volumes', '--remove-orphans').catch(() => compose('down', '--volumes', '--remove-orphans').catch(() => {}));
    await docker('image', 'rm', image).catch(() => {});
    await fs.rm(directory, { recursive: true, force: true });
}
