import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getApplicationEnvironment } from './systemMaintenance.js';

const DEFAULT_STATUS = {
    state: 'idle',
    action: null,
    message: 'Keine Systemaktion aktiv.',
    requestId: null,
    updatedAt: null,
};

export const getMaintenanceDirectory = () => (
    process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY || null
);

export const isMaintenanceAvailable = () => (
    getApplicationEnvironment() === 'production' && Boolean(getMaintenanceDirectory())
);

const getStatusPath = () => path.join(getMaintenanceDirectory(), 'status.json');
const getProgressPath = () => path.join(getMaintenanceDirectory(), 'progress.log');
const getRawLogPath = () => path.join(getMaintenanceDirectory(), 'update.log');
const getLockPath = () => path.join(getMaintenanceDirectory(), 'operation.lock');

const hasPendingRequest = async (directory) => (
    (await fs.readdir(directory)).some((name) => name.endsWith('.request'))
);

const removeCompletedLegacyLock = async (directory) => {
    try {
        await fs.access(getLockPath());
    } catch (error) {
        if (error.code === 'ENOENT') return;
        throw error;
    }

    // Agents installed before operation.lock was introduced consume the request
    // but do not remove its lock. Only reclaim it after their terminal status has
    // been written; a queued/running operation must retain exclusive ownership.
    if (await hasPendingRequest(directory)) return;
    const status = await getMaintenanceStatus();
    if (['queued', 'running'].includes(status.state)) return;
    const claimedPath = path.join(directory, `.completed-lock-${randomUUID()}`);
    try {
        // Rename is atomic: concurrent callers cannot both reclaim the same
        // legacy lock and accidentally remove the winner's newly-created lock.
        await fs.rename(getLockPath(), claimedPath);
        await fs.rm(claimedPath, { force: true });
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
};

const readLogTail = async (filePath, maxCharacters) => {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content.slice(-maxCharacters);
    } catch (error) {
        if (error.code === 'ENOENT') return '';
        throw error;
    }
};

const replaceLog = async (filePath, content) => {
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    try {
        await fs.writeFile(temporaryPath, content, { mode: 0o660 });
        await fs.chmod(temporaryPath, 0o660);
        await fs.rename(temporaryPath, filePath);
    } catch (error) {
        await fs.rm(temporaryPath, { force: true });
        throw error;
    }
};

export const getMaintenanceLogs = async () => {
    if (!isMaintenanceAvailable()) return { progress: [], details: '' };
    const [progress, details] = await Promise.all([
        readLogTail(getProgressPath(), 16000),
        readLogTail(getRawLogPath(), 64000),
    ]);
    return {
        progress: progress.split('\n').filter(Boolean).slice(-100),
        details,
    };
};

const writeStatus = async (status) => {
    const directory = getMaintenanceDirectory();
    await fs.mkdir(directory, { recursive: true });
    const temporaryPath = path.join(directory, `.status-${randomUUID()}.tmp`);
    await fs.writeFile(temporaryPath, JSON.stringify(status, null, 2), { mode: 0o660 });
    await fs.rename(temporaryPath, getStatusPath());
};

export const getMaintenanceStatus = async () => {
    if (!isMaintenanceAvailable()) {
        return {
            ...DEFAULT_STATUS,
            available: false,
            environment: getApplicationEnvironment(),
            message: 'Systemwartung ist nur in der Raspberry-Pi-Produktion verfügbar.',
        };
    }
    try {
        const status = JSON.parse(await fs.readFile(getStatusPath(), 'utf8'));
        const normalized = { ...DEFAULT_STATUS, ...status, available: true, environment: 'production' };
        const validStates = ['idle', 'queued', 'running', 'succeeded', 'failed', 'rolled_back'];
        if (!validStates.includes(normalized.state)) throw new Error('Die Wartungsdatei enthält einen ungültigen Status');
        if (normalized.state === 'queued' && normalized.updatedAt && Date.now() - Date.parse(normalized.updatedAt) > 30000) {
            return { ...normalized, state: 'failed', message: 'Die Wartungsanfrage wurde vom Wartungsdienst nicht übernommen. Bitte Dienststatus prüfen.' };
        }
        return normalized;
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        return { ...DEFAULT_STATUS, available: true, environment: 'production' };
    }
};

export const queueMaintenanceAction = async (action) => {
    if (!['update', 'restart'].includes(action)) throw new Error('Unbekannte Systemaktion');
    if (!isMaintenanceAvailable()) {
        const error = new Error('Systemwartung ist in dieser Umgebung nicht verfügbar');
        error.code = 'MAINTENANCE_UNAVAILABLE';
        throw error;
    }

    const directory = getMaintenanceDirectory();
    await fs.mkdir(directory, { recursive: true });
    await removeCompletedLegacyLock(directory);
    const requestId = randomUUID();
    let lock;
    try {
        lock = await fs.open(getLockPath(), 'wx', 0o660);
        await lock.writeFile(`${requestId}\n`);
        await lock.close();
        lock = null;
    } catch (error) {
        await lock?.close();
        if (error.code !== 'EEXIST') throw error;
        const actionError = new Error('Es läuft bereits eine Systemaktion');
        actionError.code = 'ACTION_IN_PROGRESS';
        throw actionError;
    }

    const requestPath = path.join(directory, `${requestId}.request`);
    const temporaryPath = `${requestPath}.tmp`;
    const queuedStatus = {
        state: 'queued',
        action,
        message: action === 'update' ? 'Update wurde angefordert.' : 'Neustart wurde angefordert.',
        requestId,
        updatedAt: new Date().toISOString(),
    };

    try {
        const startedAt = new Date().toISOString();
        await Promise.all([
            replaceLog(getProgressPath(), `${startedAt} ${action === 'update' ? 'Update' : 'Neustart'} wurde angefordert.\n`),
            replaceLog(getRawLogPath(), `=== ${startedAt} ${action.toUpperCase()} ===\n`),
        ]);
        await writeStatus(queuedStatus);
        await fs.writeFile(temporaryPath, `${action}\n`, { mode: 0o660 });
        await fs.rename(temporaryPath, requestPath);
        return { ...queuedStatus, available: true, environment: 'production' };
    } catch (error) {
        await Promise.allSettled([fs.rm(temporaryPath, { force: true }), fs.rm(getLockPath(), { force: true })]);
        throw error;
    }
};
