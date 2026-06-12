import { spawn } from 'child_process';
import {
    handleError,
    handleMethodNotAllowed,
    handleSuccess,
} from '../../utils/apiHelpers.js';
import {
    appendSystemMaintenanceLog,
    getServiceName,
    getSystemConnectivity,
    getSystemMaintenanceStatus,
    getSystemctlPath,
    updateSystemMaintenanceStatus,
} from '../../utils/systemMaintenance.js';

const RESTART_DELAY_SECONDS = 1;

const spawnDelayedRestart = () => {
    const systemctlPath = getSystemctlPath();
    const serviceName = getServiceName();
    const restartCommand = `sleep ${RESTART_DELAY_SECONDS} && sudo "${systemctlPath}" restart "${serviceName}"`;

    const child = spawn('/bin/sh', ['-c', restartCommand], {
        detached: true,
        stdio: 'ignore',
    });

    child.unref();
};

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            return await handleGetSystemMaintenance(res);
        }

        if (req.method === 'POST') {
            return await handlePostSystemMaintenance(req, res);
        }

        return handleMethodNotAllowed(res, ['GET', 'POST']);
    } catch (error) {
        return handleError(res, error, 500, 'Fehler bei der Systemwartung');
    }
}

async function handleGetSystemMaintenance(res) {
    const [connectivity, status] = await Promise.all([
        getSystemConnectivity(),
        getSystemMaintenanceStatus(),
    ]);

    return handleSuccess(res, {
        ...connectivity,
        status,
        serviceName: getServiceName(),
    }, 'Systemstatus erfolgreich geladen');
}

async function handlePostSystemMaintenance(req, res) {
    const action = req.body?.action;

    if (action !== 'update-and-restart') {
        return handleError(res, new Error('Ungültige Wartungsaktion'), 400);
    }

    const [connectivity, currentStatus] = await Promise.all([
        getSystemConnectivity(),
        getSystemMaintenanceStatus(),
    ]);

    if (!connectivity.canRunUpdate) {
        return handleError(res, new Error('Aktualisierung nur mit LAN- und Internetverbindung möglich'), 400);
    }

    if (currentStatus.state === 'queued' || currentStatus.state === 'running') {
        return handleError(res, new Error('Es läuft bereits eine Systemaktion'), 409);
    }

    await updateSystemMaintenanceStatus({
        state: 'queued',
        action: 'update-and-restart',
        currentStep: 'restart-queued',
        message: 'Aktualisierung und Neustart wurden angefordert.',
        lastRequestedAt: new Date().toISOString(),
        lastError: null,
    });
    await appendSystemMaintenanceLog('Frontend hat einen Update-Neustart angefordert.');

    spawnDelayedRestart();

    return handleSuccess(res, {
        queued: true,
        restartInSeconds: RESTART_DELAY_SECONDS,
    }, 'Aktualisierung und Neustart wurden eingeplant');
}
