const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const readHeader = (headers, name) => {
    if (!headers) return null;
    if (typeof headers.get === 'function') return headers.get(name);
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value || null;
};

const normalizeHost = (value) => String(value || '').split(',')[0].trim().toLowerCase();

export const hasSafeRequestOrigin = ({ method, headers, urlHost = null }) => {
    if (SAFE_METHODS.has(String(method || '').toUpperCase())) return true;

    const fetchSite = readHeader(headers, 'sec-fetch-site');
    if (fetchSite === 'cross-site') return false;
    if (fetchSite === 'same-origin') return true;

    const origin = readHeader(headers, 'origin');
    if (!origin) return true;

    try {
        const originHost = normalizeHost(new URL(origin).host);
        const requestHosts = new Set([
            normalizeHost(readHeader(headers, 'host')),
            normalizeHost(urlHost),
        ].filter(Boolean));
        return requestHosts.has(originHost);
    } catch {
        return false;
    }
};
