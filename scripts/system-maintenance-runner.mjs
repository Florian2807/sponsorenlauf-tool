#!/usr/bin/env node

import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { createDatabaseBackup, restoreDatabaseBackup } from '../src/utils/backupService.js';
import { getDatabasePath } from '../src/utils/database.js';
import { runDatabaseMigrations } from '../src/utils/migrationService.js';
import { getGitUpdateDecision } from '../src/utils/updatePolicy.js';
import {
  appendSystemMaintenanceLog,
  getSystemConnectivity,
  updateSystemMaintenanceStatus,
} from '../src/utils/systemMaintenance.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

const npmCommand = process.env.NPM_BIN || 'npm';
const nodeCommand = process.env.NODE_BIN || process.execPath;
const gitCommand = process.env.GIT_BIN || 'git';
const updateRemote = process.env.SPONSORENLAUF_UPDATE_REMOTE || 'origin';
const updateBranch = process.env.SPONSORENLAUF_UPDATE_BRANCH || 'main';
const remoteRef = `${updateRemote}/${updateBranch}`;
const mode = process.argv[2] || 'startup';
const rollbackRoot = path.join(repoRoot, '.update-rollback');
const rollbackStatePath = path.join(rollbackRoot, 'update-state.json');

let currentStep = 'initializing';
let currentSchemaReady = false;
let checkoutUpdated = false;
let previousCommit = null;
let updateBackup = null;

const logCommandOutput = async (output) => {
  const lines = String(output || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-12);

  for (const line of lines) {
    await appendSystemMaintenanceLog(line.slice(0, 1000));
  }
};

const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const runCommand = async (command, args, stepLabel) => {
  await appendSystemMaintenanceLog(`${stepLabel} gestartet: ${command} ${args.join(' ')}`);

  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: repoRoot,
    timeout: 20 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (stdout?.trim()) await logCommandOutput(stdout);
  if (stderr?.trim()) await logCommandOutput(stderr);

  return stdout?.trim() || '';
};

const commandSucceeds = async (command, args) => {
  try {
    await execFileAsync(command, args, {
      cwd: repoRoot,
      timeout: 60 * 1000,
      maxBuffer: 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
};

const setStep = async (step, message) => {
  currentStep = step;
  await updateSystemMaintenanceStatus({ state: 'running', currentStep: step, message });
};

const markFailure = async (error, { recovered = false } = {}) => {
  const baseMessage = error?.message || 'Unbekannter Fehler bei der Systemwartung';
  const message = recovered
    ? `Update fehlgeschlagen; vorheriger Stand wurde wiederhergestellt: ${baseMessage}`
    : baseMessage;

  try {
    await updateSystemMaintenanceStatus({
      state: 'failed',
      currentStep: recovered ? 'rollback-complete' : currentStep,
      message,
      lastError: baseMessage,
      lastFailureAt: new Date().toISOString(),
      lastFinishedAt: new Date().toISOString(),
    });
    await appendSystemMaintenanceLog(`Fehler: ${message}`);
  } catch (statusError) {
    console.error(`Systemwartung fehlgeschlagen: ${message}`);
    console.error(`Status konnte nicht gespeichert werden: ${statusError.message}`);
  }
};

const markFinished = async (state, step, message) => {
  const now = new Date().toISOString();
  await updateSystemMaintenanceStatus({
    state,
    currentStep: step,
    message,
    lastError: null,
    lastFinishedAt: now,
    ...(state === 'succeeded' ? { lastSuccessfulRunAt: now } : {}),
  });
  await appendSystemMaintenanceLog(message);
};

const databaseExists = async () => {
  return pathExists(path.resolve(repoRoot, getDatabasePath()));
};

const createStartupBackup = async (reason, { log = true } = {}) => {
  if (!await databaseExists()) return null;

  const backup = await createDatabaseBackup({ reason });
  if (log) {
    await appendSystemMaintenanceLog(`Datenbank-Sicherheitskopie erstellt: ${backup.filename}`);
  }
  return backup;
};

const runMigrations = async (label) => {
  await runCommand(nodeCommand, [path.join(repoRoot, 'initDB.js')], label);
};

const writeRollbackState = async (state) => {
  await fs.writeFile(rollbackStatePath, JSON.stringify(state, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
};

const prepareRollbackSnapshot = async (commit, backup) => {
  await fs.rm(rollbackRoot, { recursive: true, force: true });
  await fs.mkdir(rollbackRoot, { recursive: true, mode: 0o700 });

  for (const directoryName of ['node_modules', '.next']) {
    const sourcePath = path.join(repoRoot, directoryName);
    if (!await pathExists(sourcePath)) {
      throw new Error(`Rollback-Vorbereitung fehlgeschlagen: ${directoryName} fehlt`);
    }

    await runCommand(
      process.env.CP_BIN || 'cp',
      ['-al', sourcePath, path.join(rollbackRoot, directoryName)],
      `Rollback-Kopie ${directoryName}`
    );
  }

  await writeRollbackState({
    phase: 'prepared',
    previousCommit: commit,
    backupPath: backup?.backupPath || null,
    createdAt: new Date().toISOString(),
  });
};

const readRollbackState = async () => {
  if (!await pathExists(rollbackStatePath)) return null;
  return JSON.parse(await fs.readFile(rollbackStatePath, 'utf8'));
};

const restoreArtifactSnapshot = async (directoryName) => {
  const snapshotPath = path.join(rollbackRoot, directoryName);
  if (!await pathExists(snapshotPath)) {
    throw new Error(`Rollback-Artefakt fehlt: ${directoryName}`);
  }

  const livePath = path.join(repoRoot, directoryName);
  await fs.rm(livePath, { recursive: true, force: true });
  await fs.rename(snapshotPath, livePath);
};

const restoreRollbackState = async (state, { logCommands = true } = {}) => {
  if (!state?.previousCommit || !/^[0-9a-f]{40}$/i.test(state.previousCommit)) {
    throw new Error('Rollback-Status enthält keinen gültigen Git-Commit');
  }

  const executeGitReset = logCommands
    ? () => runCommand(gitCommand, ['reset', '--hard', state.previousCommit], 'git rollback')
    : () => execFileAsync(gitCommand, ['reset', '--hard', state.previousCommit], { cwd: repoRoot });
  await executeGitReset();

  await restoreArtifactSnapshot('node_modules');
  await restoreArtifactSnapshot('.next');

  if (state.backupPath) {
    await restoreDatabaseBackup(state.backupPath);
  }

  await fs.rm(rollbackRoot, { recursive: true, force: true });
};

const recoverInterruptedUpdate = async () => {
  const state = await readRollbackState();
  if (!state) return false;

  if (state.phase === 'complete') {
    await fs.rm(rollbackRoot, { recursive: true, force: true });
    return false;
  }

  await restoreRollbackState(state, { logCommands: false });
  return true;
};

const validateUpdateConfiguration = async () => {
  if (!/^[a-zA-Z0-9._-]+$/.test(updateRemote)) {
    throw new Error('SPONSORENLAUF_UPDATE_REMOTE enthält einen ungültigen Git-Remote-Namen');
  }

  const branchIsValid = await commandSucceeds(
    gitCommand,
    ['check-ref-format', `refs/heads/${updateBranch}`]
  );
  if (!branchIsValid) {
    throw new Error('SPONSORENLAUF_UPDATE_BRANCH enthält einen ungültigen Branch-Namen');
  }
};

const rollbackUpdate = async () => {
  const state = await readRollbackState();
  if (!checkoutUpdated || !previousCommit || !state) return false;

  await setStep('rollback-code', `Setze Anwendung auf ${previousCommit.slice(0, 12)} zurück`);
  await restoreRollbackState(state);
  return true;
};

const run = async () => {
  const recoveredInterruptedUpdate = await recoverInterruptedUpdate();
  // Do not rely on the settings table before the current schema has been
  // migrated. This also makes the very first service start initialize a new DB.
  const startupBackup = await createStartupBackup('startup-before-migrations', { log: false });
  const localMigrationResult = await runDatabaseMigrations();
  currentSchemaReady = true;

  await updateSystemMaintenanceStatus({
    state: 'running',
    action: mode === 'startup' ? 'startup-update' : mode,
    currentStep: 'local-migrations',
    message: 'Lokale Datenbankmigrationen abgeschlossen',
    lastStartedAt: new Date().toISOString(),
    lastError: null,
  });

  if (recoveredInterruptedUpdate) {
    await appendSystemMaintenanceLog('Unterbrochenes Update wurde auf den letzten funktionierenden Stand zurückgesetzt.');
  }
  if (startupBackup) {
    await appendSystemMaintenanceLog(`Datenbank-Sicherheitskopie erstellt: ${startupBackup.filename}`);
  }
  await appendSystemMaintenanceLog(
    localMigrationResult.applied.length > 0
      ? `Lokale Migrationen angewendet: ${localMigrationResult.applied.join(', ')}`
      : `Lokales Schema ist aktuell (Version ${localMigrationResult.currentVersion}).`
  );

  await setStep('checking-network', 'Prüfe LAN- und Internetverbindung');
  const connectivity = await getSystemConnectivity();

  if (!connectivity.canRunUpdate) {
    const message = connectivity.lanConnected
      ? 'Lokale Migrationen abgeschlossen. Kein Internet; vorhandenes Build wird gestartet.'
      : 'Lokale Migrationen abgeschlossen. Kein LAN; vorhandenes Build wird gestartet.';
    await markFinished('skipped', 'network-unavailable', message);
    return;
  }

  await validateUpdateConfiguration();

  await setStep('checking-worktree', 'Prüfe lokalen Git-Stand');
  const trackedChanges = await runCommand(
    gitCommand,
    ['status', '--porcelain', '--untracked-files=no'],
    'git status'
  );
  if (trackedChanges) {
    await markFinished(
      'skipped',
      'local-changes',
      'GitHub-Update übersprungen: lokale Änderungen an versionierten Dateien vorhanden.'
    );
    return;
  }

  await setStep('git-fetch', `Prüfe ${remoteRef} auf Updates`);
  await runCommand(gitCommand, ['fetch', '--prune', updateRemote, updateBranch], 'git fetch');

  previousCommit = await runCommand(gitCommand, ['rev-parse', 'HEAD'], 'lokale Git-Version');
  const availableCommit = await runCommand(gitCommand, ['rev-parse', remoteRef], 'GitHub-Version');

  let canFastForward = false;
  if (previousCommit !== availableCommit) {
    canFastForward = await commandSucceeds(
      gitCommand,
      ['merge-base', '--is-ancestor', previousCommit, availableCommit]
    );
  }
  const updateDecision = getGitUpdateDecision({
    currentCommit: previousCommit,
    availableCommit,
    canFastForward,
  });

  if (updateDecision === 'up-to-date') {
    await markFinished('succeeded', 'up-to-date', 'Anwendung und Datenbankschema sind aktuell.');
    return;
  }

  if (updateDecision === 'diverged') {
    await markFinished(
      'skipped',
      'git-diverged',
      `GitHub-Update übersprungen: lokaler Stand ist von ${remoteRef} abgewichen.`
    );
    return;
  }

  await setStep('update-backup', 'Sichere migrierte Datenbank vor dem GitHub-Update');
  updateBackup = await createStartupBackup(`before-update-${availableCommit.slice(0, 12)}`);

  await setStep('rollback-snapshot', 'Sichere laufendes Build und Abhängigkeiten');
  await prepareRollbackSnapshot(previousCommit, updateBackup);

  await setStep('git-fast-forward', `Aktualisiere auf ${availableCommit.slice(0, 12)}`);
  await runCommand(gitCommand, ['merge', '--ff-only', remoteRef], 'git fast-forward');
  checkoutUpdated = true;
  await writeRollbackState({
    ...(await readRollbackState()),
    phase: 'checkout-updated',
    updatedCommit: availableCommit,
  });

  await setStep('npm-ci', 'Synchronisiere Abhängigkeiten');
  await runCommand(npmCommand, ['ci'], 'npm ci');

  await setStep('sqlite3-rebuild', 'Baue sqlite3 lokal für den Raspberry');
  await runCommand(
    npmCommand,
    ['rebuild', 'sqlite3'],
    'npm rebuild sqlite3 (lokaler Quellcode-Build)'
  );

  // This process still contains the old updater code, so execute initDB.js in
  // a fresh process to load migrations from the newly checked-out release.
  await setStep('updated-migrations', 'Führe Datenbankmigrationen des Updates aus');
  await runMigrations('aktualisierte Datenbankmigrationen');

  await setStep('build', 'Erzeuge das neue Produktions-Build');
  await runCommand(npmCommand, ['run', 'build'], 'npm run build');

  await markFinished(
    'succeeded',
    'finished',
    `Update auf ${availableCommit.slice(0, 12)} installiert; Migrationen und Build erfolgreich.`
  );
  await writeRollbackState({
    ...(await readRollbackState()),
    phase: 'complete',
    completedAt: new Date().toISOString(),
  });
  await fs.rm(rollbackRoot, { recursive: true, force: true });
};

try {
  await run();
  process.exit(0);
} catch (error) {
  if (!checkoutUpdated && previousCommit) {
    try {
      const currentCommit = await execFileAsync(gitCommand, ['rev-parse', 'HEAD'], { cwd: repoRoot });
      checkoutUpdated = currentCommit.stdout.trim() !== previousCommit;
      if (!checkoutUpdated) {
        const worktree = await execFileAsync(
          gitCommand,
          ['status', '--porcelain', '--untracked-files=no'],
          { cwd: repoRoot }
        );
        checkoutUpdated = Boolean(worktree.stdout.trim());
      }
    } catch {
      checkoutUpdated = await pathExists(rollbackStatePath);
    }
  }

  if (checkoutUpdated) {
    try {
      const recovered = await rollbackUpdate();
      await markFailure(error, { recovered });
      process.exit(recovered ? 0 : 1);
    } catch (rollbackError) {
      await markFailure(new Error(
        `${error.message}; Rollback ebenfalls fehlgeschlagen: ${rollbackError.message}`
      ));
      process.exit(1);
    }
  }

  if (await pathExists(rollbackRoot)) {
    await fs.rm(rollbackRoot, { recursive: true, force: true });
  }

  await markFailure(error);
  // Network/GitHub failures must not take down a working offline event. A local
  // migration failure is different: starting against the wrong schema is unsafe.
  process.exit(currentSchemaReady ? 0 : 1);
}
