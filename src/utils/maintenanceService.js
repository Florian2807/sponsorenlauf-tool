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
        return { ...DEFAULT_STATUS, ...status, available: true, environment: 'production' };
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
    await writeStatus(queuedStatus);
    await fs.writeFile(temporaryPath, `${action}\n`, { mode: 0o660 });
    await fs.rename(temporaryPath, requestPath);
    return { ...queuedStatus, available: true, environment: 'production' };
};
