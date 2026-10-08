import axios from 'axios';

const pending = new Map();
const cache = new Map();
let generation = 0;
export const clearClientRequestCache = () => { cache.clear(); pending.clear(); generation++; maintenanceCache = null; };

export function clientRequest(options) {
    const { cacheMs = 0, ...config } = options;
    const read = (config.method || 'GET').toUpperCase() === 'GET';
    if (!read) return axios(config).then(response => {
        clearClientRequestCache();
        if (/\/api\/(moduleConfig|donationSettings|classStructure|stations|smtp-settings|setupStatus)/.test(config.url)) {
            window.dispatchEvent(new CustomEvent('sponsorenlauf:settings-changed'));
        }
        return response;
    });
    // Requests with caller-owned cancellation must remain independently cancellable.
    if (config.signal) return axios(config);
    const key = JSON.stringify([config.url, config.params, config.responseType, config.timeout]);
    const saved = cache.get(key);
    if (cacheMs && saved && Date.now() - saved.time < cacheMs) return Promise.resolve(saved.response);
    if (pending.has(key)) return pending.get(key);
    const requestGeneration = generation;
    const promise = axios(config).then(response => {
        if (cacheMs && generation === requestGeneration) {
            if (cache.size >= 50) cache.delete(cache.keys().next().value);
            cache.set(key, { time: Date.now(), response });
        }
        return response;
    }).finally(() => { if (pending.get(key) === promise) pending.delete(key); });
    pending.set(key, promise);
    return promise;
}

let maintenancePending;
let maintenanceCache;
let fullMaintenanceRequested = false;
export function readMaintenanceStatus(full = false) {
    fullMaintenanceRequested ||= full;
    if (maintenanceCache && Date.now() - maintenanceCache.time < 1000 && (!full || maintenanceCache.full)) return Promise.resolve(maintenanceCache.data);
    if (!maintenancePending) maintenancePending = new Promise(resolve => setTimeout(resolve, 10)).then(async () => {
        const requestedFull = fullMaintenanceRequested;
        fullMaintenanceRequested = false;
        const response = await axios.get(`/api/systemMaintenance${requestedFull ? '' : '?summary=1'}`, { timeout: 5000 });
        const data = response.data.data;
        maintenanceCache = { data, full: requestedFull, time: Date.now() };
        return data;
    }).finally(() => { maintenancePending = null; });
    return maintenancePending.then(data => full && !maintenanceCache?.full ? readMaintenanceStatus(true) : data);
}

if (typeof window !== 'undefined') window.addEventListener('sponsorenlauf:settings-changed', clearClientRequestCache);
