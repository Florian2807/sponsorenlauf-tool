import fs from 'fs/promises';
import os from 'os';

export const getApplicationEnvironment = () => (
    process.env.APP_ENV === 'production' ? 'production' : 'development'
);

let internetCache = { checkedAt: 0, connected: false };

const getLinuxEthernetCarrier = async () => {
    try {
        return (await fs.readFile('/sys/class/net/eth0/carrier', 'utf8')).trim() === '1';
    } catch {
        return null;
    }
};

export const detectLanConnection = async () => {
    const interfaces = os.networkInterfaces();
    const candidates = Object.entries(interfaces).filter(([name, entries]) => (
        /^(eth|en)/i.test(name) && Array.isArray(entries) && entries.some((entry) => !entry.internal)
    ));
    const carrier = process.platform === 'linux' ? await getLinuxEthernetCarrier() : null;
    const [name = 'eth0', entries = []] = candidates[0] || [];
    const addresses = entries.filter((entry) => !entry.internal).map((entry) => entry.address);
    return {
        connected: carrier === true || addresses.length > 0,
        interface: name,
        addresses,
    };
};

export const detectInternetConnection = async () => {
    if (Date.now() - internetCache.checkedAt < 15000) return internetCache.connected;
    try {
        const response = await fetch('https://github.com', {
            method: 'HEAD',
            signal: AbortSignal.timeout(4000),
        });
        internetCache = { checkedAt: Date.now(), connected: response.ok };
        return response.ok;
    } catch {
        internetCache = { checkedAt: Date.now(), connected: false };
        return false;
    }
};

export const getSystemConnectivity = async () => {
    const [lan, internetConnected] = await Promise.all([
        detectLanConnection(),
        detectInternetConnection(),
    ]);
    return {
        lanConnected: lan.connected,
        lanInterface: lan.interface,
        lanAddresses: lan.addresses,
        internetConnected,
        environment: getApplicationEnvironment(),
    };
};
