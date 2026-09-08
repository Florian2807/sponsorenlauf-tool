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

const readLogTail = async (filePath, maxCharacters) => {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content.slice(-maxCharacters);
    } catch (error) {
        if (error.code === 'ENOENT') return '';
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

    const current = await getMaintenanceStatus();
    if (['queued', 'running'].includes(current.state)) {
        const error = new Error('Es läuft bereits eine Systemaktion');
        error.code = 'ACTION_IN_PROGRESS';
        throw error;
    }

    const directory = getMaintenanceDirectory();
    const requestId = randomUUID();
    const requestPath = path.join(directory, `${requestId}.request`);
    const temporaryPath = `${requestPath}.tmp`;
    const queuedStatus = {
        state: 'queued',
        action,
        message: action === 'update' ? 'Update wurde angefordert.' : 'Neustart wurde angefordert.',
        requestId,
        updatedAt: new Date().toISOString(),
    };

    await fs.mkdir(directory, { recursive: true });
    const startedAt = new Date().toISOString();
    await Promise.all([
        fs.writeFile(getProgressPath(), `${startedAt} ${action === 'update' ? 'Update' : 'Neustart'} wurde angefordert.\n`, { mode: 0o660 }),
        fs.writeFile(getRawLogPath(), `=== ${startedAt} ${action.toUpperCase()} ===\n`, { mode: 0o660 }),
    ]);
    await writeStatus(queuedStatus);
    await fs.writeFile(temporaryPath, `${action}\n`, { mode: 0o660 });
    await fs.rename(temporaryPath, requestPath);
    return { ...queuedStatus, available: true, environment: 'production' };
};
