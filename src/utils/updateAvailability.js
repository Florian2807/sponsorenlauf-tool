import { getApplicationEnvironment } from './systemMaintenance.js';

const SUCCESS_TTL = 6 * 60 * 60 * 1000;
const FAILURE_TTL = 30 * 60 * 1000;
let cache = { version: null, checkedAt: 0, ttl: 0, available: false, latestVersion: null };
let pending = null;

export const getUpdateAvailability = async () => {
    const version = process.env.SPONSORENLAUF_VERSION;
    if (getApplicationEnvironment() !== 'production' || !/^[0-9a-f]{40}$/i.test(version || '')) {
        return { available: false, latestVersion: null };
    }
    if (cache.version === version && Date.now() - cache.checkedAt < cache.ttl) return cache;
    if (pending) return pending;

    pending = (async () => {
        try {
            const response = await fetch(`https://api.github.com/repos/Florian2807/sponsorenlauf-tool/compare/${version}...main`, {
                headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'sponsorenlauf-tool' },
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
            const comparison = await response.json();
            const latestVersion = comparison.commits?.at(-1)?.sha || null;
            cache = {
                version,
                checkedAt: Date.now(),
                ttl: SUCCESS_TTL,
                available: comparison.status === 'ahead' && comparison.ahead_by > 0 && Boolean(latestVersion),
                latestVersion,
            };
        } catch {
            // Offline and API failures are ordinary: retry later without showing a notice.
            cache = { version, checkedAt: Date.now(), ttl: FAILURE_TTL, available: false, latestVersion: null };
        } finally {
            pending = null;
        }
        return cache;
    })();
    return pending;
};
