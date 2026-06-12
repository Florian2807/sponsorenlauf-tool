#!/usr/bin/env node

import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import {
  appendSystemMaintenanceLog,
  getSystemConnectivity,
  updateSystemMaintenanceStatus,
} from '../src/utils/systemMaintenance.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const npmCommand = process.env.NPM_BIN || 'npm';
const gitCommand = process.env.GIT_BIN || 'git';

const mode = process.argv[2] || 'startup';

const runCommand = async (command, args, stepLabel) => {
  await appendSystemMaintenanceLog(`${stepLabel} gestartet: ${command} ${args.join(' ')}`);

  const { stdout, stderr } = await execFileAsync(command, args, {
    cwd: repoRoot,
    timeout: 20 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (stdout?.trim()) {
    await appendSystemMaintenanceLog(stdout.trim());
  }

  if (stderr?.trim()) {
    await appendSystemMaintenanceLog(stderr.trim());
  }
};

const markFailure = async (error, step) => {
  const message = error?.message || 'Unbekannter Fehler bei der Systemwartung';

  await updateSystemMaintenanceStatus({
    state: 'failed',
    currentStep: step,
    message,
    lastError: message,
    lastFailureAt: new Date().toISOString(),
    lastFinishedAt: new Date().toISOString(),
  });
  await appendSystemMaintenanceLog(`Fehler: ${message}`);
};

const markSuccess = async (message) => {
  const now = new Date().toISOString();

  await updateSystemMaintenanceStatus({
    state: 'succeeded',
    currentStep: 'finished',
    message,
    lastError: null,
    lastFinishedAt: now,
    lastSuccessfulRunAt: now,
  });
  await appendSystemMaintenanceLog(message);
};

try {
  await updateSystemMaintenanceStatus({
    state: 'running',
    action: mode === 'startup' ? 'startup-update' : mode,
    currentStep: 'checking-network',
    message: 'Prüfe LAN- und Internetverbindung',
    lastStartedAt: new Date().toISOString(),
    lastError: null,
  });

  const connectivity = await getSystemConnectivity();

  if (!connectivity.canRunUpdate) {
    const message = connectivity.lanConnected
      ? 'LAN erkannt, aber kein Internet. Vorhandenes Build wird weiter verwendet.'
      : 'Kein LAN erkannt. Vorhandenes Build wird weiter verwendet.';

    await updateSystemMaintenanceStatus({
      state: 'skipped',
      currentStep: 'network-unavailable',
      message,
      lastFinishedAt: new Date().toISOString(),
    });
    await appendSystemMaintenanceLog(message);
    process.exit(0);
  }

  await updateSystemMaintenanceStatus({
    state: 'running',
    currentStep: 'git-pull',
    message: 'Repository wird aktualisiert',
  });
  await runCommand(gitCommand, ['pull', '--ff-only'], 'git pull');

  await updateSystemMaintenanceStatus({
    state: 'running',
    currentStep: 'npm-ci',
    message: 'Abhängigkeiten werden synchronisiert',
  });
  await runCommand(npmCommand, ['ci'], 'npm ci');

  await updateSystemMaintenanceStatus({
    state: 'running',
    currentStep: 'build',
    message: 'Build wird erstellt',
  });
  await runCommand(npmCommand, ['run', 'build'], 'npm run build');

  await markSuccess('Repository aktualisiert und Build erfolgreich erstellt.');
  process.exit(0);
} catch (error) {
  await markFailure(error, 'build-process');
  process.exit(1);
}
