#!/usr/bin/env node

import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import AdmZip from 'adm-zip';
import { dbAll, dbGet, dbRun, getDatabasePath } from '../src/utils/database.js';
import {
    createDatabaseBackup,
    getBackupDirectory,
    listDatabaseBackups,
    restoreDatabaseBackup,
    verifyApplicationDatabaseBackup,
} from '../src/utils/backupService.js';
import { setAdminPin, validateAdminPin } from '../src/utils/adminAuthService.js';
import { getLatestSchemaVersion, runDatabaseMigrations } from '../src/utils/migrationService.js';
import { getAllSettings } from '../src/utils/settingsService.js';
import { getSmtpConfiguration, testSmtpConfiguration } from '../src/utils/smtpService.js';
import { getRecentStations } from '../src/utils/stationService.js';
import { getSystemConnectivity } from '../src/utils/systemMaintenance.js';
import { getMaintenanceStatus, queueMaintenanceAction } from '../src/utils/maintenanceService.js';

const VERSION = process.env.SPONSORENLAUF_VERSION || 'development';
const args = process.argv.slice(2);
const json = args.includes('--json');
const yes = args.includes('--yes');
const positional = args.filter((arg) => !['--json', '--yes'].includes(arg));

const print = (value) => {
    if (json) console.log(JSON.stringify(value, null, 2));
    else if (typeof value === 'string') console.log(value);
    else Object.entries(value).forEach(([key, item]) => console.log(
        `${key}: ${item && typeof item === 'object' ? JSON.stringify(item) : (item ?? '-')}`
    ));
};

const fail = (message, code = 1) => {
    console.error(`Fehler: ${message}`);
    process.exitCode = code;
};

const formatBytes = (bytes) => {
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    let value = Number(bytes);
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
    return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
};

const confirm = async (message, expected = 'JA') => {
    if (yes) return true;
    if (!stdin.isTTY) throw new Error(`Bestätigung erforderlich. Interaktiv starten oder --yes verwenden.`);
    const prompt = readline.createInterface({ input: stdin, output: stdout });
    const answer = await prompt.question(`${message}\nZum Bestätigen ${expected} eingeben: `);
    prompt.close();
    return answer === expected;
};

const readSecret = async (label) => {
    if (!stdin.isTTY || !stdout.isTTY) throw new Error('Die PIN muss in einem interaktiven Terminal eingegeben werden.');
    stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    return new Promise((resolve, reject) => {
        let value = '';
        const cleanup = () => {
            stdin.removeListener('data', onData);
            stdin.setRawMode(false);
            stdin.pause();
            stdout.write('\n');
        };
        const onData = (character) => {
            if (character === '\u0003') { cleanup(); reject(new Error('Abgebrochen')); return; }
            if (character === '\r' || character === '\n') { cleanup(); resolve(value); return; }
            if (character === '\u007f') { value = value.slice(0, -1); return; }
            if (/\d/.test(character)) value += character;
        };
        stdin.on('data', onData);
    });
};

const readiness = async () => {
    const databasePath = path.resolve(getDatabasePath());
    const [integrity, migrations, backup, stations, smtp, disk, connectivity, lastScan] = await Promise.all([
        dbGet('PRAGMA quick_check'),
        dbGet('SELECT MAX(version) AS version FROM schema_migrations').catch(() => null),
        listDatabaseBackups().then((items) => items[0] || null),
        getRecentStations(15),
        getSmtpConfiguration(),
        fs.statfs(path.dirname(databasePath)),
        getSystemConnectivity(),
        dbGet('SELECT timestamp, student_id FROM rounds ORDER BY timestamp DESC LIMIT 1'),
    ]);
    const freeBytes = Number(disk.bavail) * Number(disk.bsize);
    const checks = {
        database: integrity?.quick_check === 'ok',
        schema: migrations?.version === getLatestSchemaVersion(),
        diskSpace: freeBytes >= 500 * 1024 * 1024,
        recentBackup: Boolean(backup && Date.now() - new Date(backup.createdAt).getTime() < 86400000),
    };
    return { ready: Object.values(checks).every(Boolean), checks, version: VERSION, freeBytes, backup, stations, smtp, connectivity, lastScan };
};

const showReady = async () => {
    const result = await readiness();
    if (json) print(result);
    else {
        console.log(result.ready ? 'BEREIT' : 'NICHT BEREIT');
        for (const [name, ok] of Object.entries(result.checks)) console.log(`${ok ? '✓' : '✗'} ${name}`);
        console.log(`Freier Speicher: ${formatBytes(result.freeBytes)}`);
        console.log(`Letztes Backup: ${result.backup?.filename || 'keines'}`);
        console.log(`Aktive Stationen: ${result.stations.length}`);
        console.log(`SMTP: ${result.smtp ? 'eingerichtet' : 'nicht eingerichtet'}`);
    }
    if (!result.ready) process.exitCode = 2;
};

const doctor = async () => {
    const result = await readiness();
    const databasePath = path.resolve(getDatabasePath());
    const permissions = await fs.access(databasePath, fsConstants.R_OK | fsConstants.W_OK).then(() => true).catch(() => false);
    const maintenance = await getMaintenanceStatus();
    const details = { ...result, databasePath, databaseReadableAndWritable: permissions, maintenance };
    if (json) print(details);
    else {
        await showReady();
        console.log(`Datenbank: ${databasePath}`);
        console.log(`Datenbankzugriff: ${permissions ? 'lesen/schreiben möglich' : 'FEHLER'}`);
        console.log(`Wartung: ${maintenance.available ? maintenance.state : 'nicht verfügbar'}`);
    }
    if (!permissions) process.exitCode = 2;
};

const resetPin = async () => {
    const first = await readSecret('Neue Admin-PIN: ');
    const second = await readSecret('Neue Admin-PIN wiederholen: ');
    if (!validateAdminPin(first) || first !== second) throw new Error('PINs stimmen nicht überein oder sind ungültig.');
    const backup = await createDatabaseBackup({ reason: 'before-pin-reset' });
    const configured = Boolean(await dbGet('SELECT id FROM admin_credentials WHERE id = 1'));
    await setAdminPin(first, { requireExisting: configured });
    await dbRun('DELETE FROM admin_login_attempts');
    print(json ? { reset: true, backup: backup.filename } : `Admin-PIN zurückgesetzt. Sicherheitsbackup: ${backup.filename}`);
};

const backupCommand = async (action, target) => {
    if (action === 'create') {
        const backup = await createDatabaseBackup({ reason: 'cli' });
        print(json ? backup : `Backup erstellt: ${backup.filename}`);
        return;
    }
    if (action === 'list') {
        const backups = await listDatabaseBackups();
        if (json) print(backups);
        else backups.forEach((item) => console.log(`${item.filename}\t${formatBytes(item.size)}\t${item.createdAt}`));
        return;
    }
    if (!target) throw new Error(`backup ${action} benötigt einen Dateipfad.`);
    const source = path.resolve(target);
    if (action === 'verify') {
        await verifyApplicationDatabaseBackup(source);
        print(json ? { valid: true, path: source } : `Backup ist gültig: ${source}`);
        return;
    }
    if (action === 'copy') {
        const backup = await createDatabaseBackup({ reason: 'cli-export' });
        const destinationDirectory = path.resolve(target);
        await fs.mkdir(destinationDirectory, { recursive: true });
        const destination = path.join(destinationDirectory, backup.filename);
        await fs.copyFile(backup.backupPath, destination, fsConstants.COPYFILE_EXCL);
        print(json ? { copied: destination } : `Backup kopiert: ${destination}`);
        return;
    }
    if (action === 'restore') {
        await verifyApplicationDatabaseBackup(source);
        if (!await confirm(`ACHTUNG: ${source} wird als aktive Datenbank eingespielt.`)) throw new Error('Abgebrochen.');
        const safety = await createDatabaseBackup({ reason: 'before-cli-restore' });
        try { await restoreDatabaseBackup(source); }
        catch (error) { await restoreDatabaseBackup(safety.backupPath); throw error; }
        print(json ? { restored: true, safetyBackup: safety.filename } : `Backup wiederhergestellt. Sicherheitsbackup: ${safety.filename}`);
        return;
    }
    throw new Error(`Unbekannte Backup-Aktion: ${action || '-'}`);
};

const maskedConfig = async () => {
    const settings = await getAllSettings();
    const safeSettings = Object.fromEntries(Object.entries(settings).map(([key, value]) => (
        /pass|secret|token|credential|pin/i.test(key) ? [key, '***'] : [key, value]
    )));
    const smtp = await getSmtpConfiguration();
    return {
        version: VERSION,
        databasePath: path.resolve(getDatabasePath()),
        backupDirectory: getBackupDirectory(),
        maxBackups: process.env.SPONSORENLAUF_MAX_BACKUPS || '20',
        smtp,
        settings: safeSettings,
    };
};

const supportBundle = async (target) => {
    const directory = target ? path.resolve(target) : getBackupDirectory();
    await fs.mkdir(directory, { recursive: true });
    const filename = `sponsorenlauf-support-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const output = path.join(directory, filename);
    const zip = new AdmZip();
    const diagnostic = await readiness();
    zip.addFile('diagnose.json', Buffer.from(JSON.stringify(diagnostic, null, 2)));
    zip.addFile('config-sanitized.json', Buffer.from(JSON.stringify(await maskedConfig(), null, 2)));
    zip.addFile('system.json', Buffer.from(JSON.stringify({ platform: process.platform, arch: process.arch, node: process.version, hostname: os.hostname() }, null, 2)));
    await zip.writeZipPromise(output);
    await fs.chmod(output, 0o600);
    print(json ? { path: output } : `Support-Paket erstellt: ${output}`);
};

const usage = () => console.log(`Sponsorenlauf CLI

  sponsorenlauf status|ready|doctor [--json]
  sponsorenlauf admin reset-pin|unlock
  sponsorenlauf backup create|list|verify <datei>|copy <ordner>|restore <datei> [--yes]
  sponsorenlauf database check|migrate|optimize
  sponsorenlauf config show
  sponsorenlauf smtp test
  sponsorenlauf update [status]
  sponsorenlauf restart
  sponsorenlauf maintenance status|update|restart
  sponsorenlauf support-bundle [zielordner]

Host-Befehle wie logs, start und stop stehen über das installierte Wrapper-Script zur Verfügung.`);

const main = async () => {
    const [command, action, target] = positional;
    if (!command || ['help', '--help', '-h'].includes(command)) { usage(); return; }
    if (command === 'status' || command === 'ready') return showReady();
    if (command === 'doctor') return doctor();
    if (command === 'admin' && action === 'reset-pin') return resetPin();
    if (command === 'admin' && action === 'unlock') {
        const result = await dbRun('DELETE FROM admin_login_attempts');
        print(json ? { unlocked: true, removed: result.changes } : `Anmeldesperren aufgehoben (${result.changes}).`); return;
    }
    if (command === 'backup') return backupCommand(action, target);
    if (command === 'database' && action === 'check') {
        const result = await dbGet('PRAGMA integrity_check');
        print(json ? result : `Datenbankintegrität: ${result.integrity_check}`);
        if (result.integrity_check !== 'ok') process.exitCode = 2; return;
    }
    if (command === 'database' && action === 'migrate') return print(await runDatabaseMigrations());
    if (command === 'database' && action === 'optimize') { await dbRun('PRAGMA optimize'); print('Datenbank optimiert.'); return; }
    if (command === 'config' && action === 'show') return print(await maskedConfig());
    if (command === 'smtp' && action === 'test') { await testSmtpConfiguration({}); print('Test-E-Mail erfolgreich versendet.'); return; }
    if (command === 'update' && action === 'status') return print(await getMaintenanceStatus());
    if (command === 'update' || command === 'restart') {
        const maintenanceAction = command === 'update' ? 'update' : 'restart';
        if (!await confirm(`${maintenanceAction === 'update' ? 'Update' : 'Neustart'} anfordern?`)) throw new Error('Abgebrochen.');
        return print(await queueMaintenanceAction(maintenanceAction));
    }
    if (command === 'maintenance' && action === 'status') return print(await getMaintenanceStatus());
    if (command === 'maintenance' && ['update', 'restart'].includes(action)) {
        if (!await confirm(`${action === 'update' ? 'Update' : 'Neustart'} anfordern?`)) throw new Error('Abgebrochen.');
        return print(await queueMaintenanceAction(action));
    }
    if (command === 'support-bundle') return supportBundle(action);
    throw new Error('Unbekannter Befehl. Mit "sponsorenlauf help" wird die Hilfe angezeigt.');
};

try { await main(); } catch (error) { fail(error.message); }
