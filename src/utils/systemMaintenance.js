import fs from 'fs/promises';
import os from 'os';
import { getSetting, setSetting } from './settingsService.js';

const STATUS_KEY = 'system_maintenance_status';
const MAX_LOG_LINES = 40;

const DEFAULT_STATUS = {
    state: 'idle',
    action: null,
    currentStep: null,
    message: 'Bereit',
    lastRequestedAt: null,
    lastStartedAt: null,
    lastFinishedAt: null,
    lastSuccessfulRunAt: null,
    lastFailureAt: null,
    lastError: null,
    logLines: [],
};

export const getServiceName = () => {
    const serviceName = process.env.SYSTEM_MAINTENANCE_SERVICE_NAME || 'sponsorenlauf';

    if (!/^[a-zA-Z0-9@._-]+$/.test(serviceName)) {
        throw new Error('Ungültiger Systemd-Service-Name in SYSTEM_MAINTENANCE_SERVICE_NAME');
    }

    return serviceName;
};

export const getSystemctlPath = () => {
    return process.env.SYSTEM_MAINTENANCE_SYSTEMCTL_PATH || '/bin/systemctl';
};

export const getDefaultMaintenanceStatus = () => ({ ...DEFAULT_STATUS, logLines: [] });

export const normalizeMaintenanceStatus = (status = {}) => {
    return {
        ...DEFAULT_STATUS,
        ...status,
        logLines: Array.isArray(status?.logLines) ? status.logLines.slice(-MAX_LOG_LINES) : [],
    };
};

export const getSystemMaintenanceStatus = async () => {
    const status = await getSetting(STATUS_KEY, getDefaultMaintenanceStatus());
    return normalizeMaintenanceStatus(status);
};

export const writeSystemMaintenanceStatus = async (status) => {
    await setSetting(STATUS_KEY, normalizeMaintenanceStatus(status));
};

export const updateSystemMaintenanceStatus = async (patch) => {
    const currentStatus = await getSystemMaintenanceStatus();
    const nextStatus = {
        ...currentStatus,
        ...patch,
    };

    await writeSystemMaintenanceStatus(nextStatus);
    return nextStatus;
};

export const appendSystemMaintenanceLog = async (message) => {
    const currentStatus = await getSystemMaintenanceStatus();
    const timestamp = new Date().toISOString();
    const nextLogLines = [...currentStatus.logLines, `[${timestamp}] ${message}`].slice(-MAX_LOG_LINES);

    const nextStatus = {
        ...currentStatus,
        logLines: nextLogLines,
        message,
    };

    await writeSystemMaintenanceStatus(nextStatus);
    return nextStatus;
};

const getLinuxEthernetCarrier = async () => {
    try {
        const carrier = await fs.readFile('/sys/class/net/eth0/carrier', 'utf8');
        return carrier.trim() === '1';
    } catch {
        return null;
    }
};

export const detectLanConnection = async () => {
    const interfaces = os.networkInterfaces();
    const eth0Addresses = (interfaces.eth0 || []).filter((entry) => !entry.internal);
    const fallbackInterface = Object.entries(interfaces).find(([name, entries]) => (
        /^(eth|en)/i.test(name) && Array.isArray(entries) && entries.some((entry) => !entry.internal)
    ));

    const carrier = process.platform === 'linux' ? await getLinuxEthernetCarrier() : null;

    if (carrier !== null) {
        return {
            connected: carrier || eth0Addresses.length > 0,
            interface: 'eth0',
            hasAddress: eth0Addresses.length > 0,
            addresses: eth0Addresses.map((entry) => entry.address),
        };
    }

    if (eth0Addresses.length > 0) {
        return {
            connected: true,
            interface: 'eth0',
            hasAddress: true,
            addresses: eth0Addresses.map((entry) => entry.address),
        };
    }

    if (fallbackInterface) {
        const [name, entries] = fallbackInterface;
        const usableEntries = entries.filter((entry) => !entry.internal);

        return {
            connected: true,
            interface: name,
            hasAddress: usableEntries.length > 0,
            addresses: usableEntries.map((entry) => entry.address),
        };
    }

    return {
        connected: false,
        interface: 'eth0',
        hasAddress: false,
        addresses: [],
    };
};

export const detectInternetConnection = async () => {
    try {
        const response = await fetch('https://github.com', {
            method: 'HEAD',
            signal: AbortSignal.timeout(4000),
        });

        return response.ok;
    } catch {
        return false;
    }
};

export const getSystemConnectivity = async () => {
    const lan = await detectLanConnection();
    const internetConnected = lan.connected ? await detectInternetConnection() : false;

    return {
        lanConnected: lan.connected,
        lanInterface: lan.interface,
        lanAddresses: lan.addresses,
        internetConnected,
        canRunUpdate: lan.connected && internetConnected,
    };
};
