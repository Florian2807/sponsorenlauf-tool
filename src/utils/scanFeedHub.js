import pg from 'pg';
import { postgresConfig } from './postgres.js';
import { getRecentScans } from './scanFeedService.js';
import { encodeScanUpdate } from './scanFeedProtocol.js';

// One listener per server process, one snapshot per device (shared by scanner/display).
// PostgreSQL delivers notifications only after commit, including writes from other processes.
export const createScanFeedHub = ({ readScans = getRecentScans, createClient = () => new pg.Client({
    ...postgresConfig(), application_name: 'scan-feed-listener', keepAlive: true,
}), fallbackMs = 5 * 60 * 1000 } = {}) => {
    const scopes = new Map();
    let client;
    let connecting;
    let reconnectTimer;
    let fallbackTimer;

    const refresh = (scope) => {
        scope.dirty = true;
        if (scope.pending) return scope.pending;
        scope.pending = (async () => {
            do {
                scope.dirty = false;
                const limit = Math.max(...[...scope.subscribers].map(subscriber => subscriber.limit));
                scope.readLimit = limit;
                const scans = await readScans(scope.device, limit);
                scope.scans = scans;
                const message = JSON.stringify({ scans });
                for (const subscriber of scope.subscribers) {
                    if (subscriber.delta) {
                        const view = scans.slice(0, subscriber.limit);
                        const update = encodeScanUpdate(subscriber.previousView, view);
                        subscriber.previousView = view;
                        if (update) subscriber.onSnapshot(JSON.stringify(update));
                        continue;
                    }
                    if (subscriber.previous !== message) {
                        subscriber.previous = message;
                        subscriber.onSnapshot(message);
                    }
                }
            } while (scope.dirty && scope.subscribers.size);
        })().catch(error => {
            for (const subscriber of [...scope.subscribers]) subscriber.onError(error);
            throw error;
        }).finally(() => { scope.pending = null; });
        return scope.pending;
    };
    const schedule = (scope) => {
        // Combine notifications from imports and nearly simultaneous scans.
        if (scope.timer) return;
        scope.timer = setTimeout(() => {
            scope.timer = null;
            if (scope.subscribers.size) refresh(scope).catch(() => {});
        }, 40);
    };
    const invalidate = (change = {}) => {
        for (const scope of scopes.values()) {
            const students = [change.studentId, change.previousStudentId].filter(Boolean);
            for (const subscriber of scope.subscribers) if (!scope.device || subscriber.notifyStudentChanges) subscriber.onFeedback(JSON.stringify({ studentIds: students }));
            if (!Object.keys(change).length || !scope.device || !scope.scans
                || scope.device === change.deviceId || scope.device === change.previousDeviceId
                || scope.scans.some(scan => students.includes(String(scan.student.id)))) schedule(scope);
        }
    };
    const ensureListener = () => {
        if (connecting) return connecting.then(() => client ? undefined : ensureListener());
        if (client) return Promise.resolve();
        const connection = createClient();
        client = connection;
        const lost = () => {
            if (client !== connection) return;
            client = null;
            for (const scope of scopes.values()) scope.dirty = true;
            connection.end().catch(() => {});
            if (scopes.size && !reconnectTimer) reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                ensureListener().then(() => invalidate()).catch(() => {});
            }, 2000);
        };
        connection.on('error', lost);
        connection.on('end', lost);
        connection.on('notification', event => {
            if (event.channel === 'scan_settings_changed') {
                for (const scope of scopes.values()) for (const subscriber of scope.subscribers) subscriber.onFeedback('{"settingsChanged":true}');
                return;
            }
            if (event.channel === 'scan_feedback') {
                try {
                    const feedback = JSON.parse(event.payload);
                    const scope = scopes.get(feedback.deviceId);
                    for (const subscriber of scope?.subscribers || []) subscriber.onFeedback(event.payload);
                    if (feedback.device) for (const subscriber of scopes.get(null)?.subscribers || []) subscriber.onFeedback(event.payload);
                } catch { /* Invalid transient feedback does not interrupt scan snapshots. */ }
                return;
            }
            if (event.channel !== 'scan_feed_changed') return;
            try { invalidate(JSON.parse(event.payload)); } catch { invalidate(); }
        });
        connecting = (async () => {
            try {
                await connection.connect();
                await connection.query('LISTEN scan_feed_changed; LISTEN scan_feedback; LISTEN scan_settings_changed');
            } catch (error) { lost(); throw error; }
        })().finally(() => { connecting = null; });
        return connecting;
    };
    const idle = () => {
        if (scopes.size) return;
        clearTimeout(reconnectTimer);
        clearInterval(fallbackTimer);
        reconnectTimer = fallbackTimer = null;
        const previous = client;
        client = null;
        previous?.end().catch(() => {});
    };
    return {
        async subscribe(device, onSnapshot, onError, onFeedback = () => {}, { limit = 30, delta = false, notifyStudentChanges = false } = {}) {
            const key = device || null;
            let scope = scopes.get(key);
            if (!scope) {
                scope = { device: key, subscribers: new Set(), scans: null, pending: null, timer: null };
                scopes.set(key, scope);
            }
            const subscriber = { onSnapshot, onError, onFeedback, previous: null, previousView: null, limit, delta, notifyStudentChanges };
            scope.subscribers.add(subscriber);
            if (scope.pending && limit > scope.readLimit) scope.dirty = true;
            const unsubscribe = () => {
                scope.subscribers.delete(subscriber);
                if (!scope.subscribers.size) {
                    clearTimeout(scope.timer);
                    if (scopes.get(key) === scope) scopes.delete(key);
                }
                idle();
            };
            try {
                // LISTEN before the snapshot prevents missing a concurrent commit.
                await ensureListener();
                if (!fallbackTimer) fallbackTimer = setInterval(() => invalidate(), fallbackMs);
                if (scope.scans && !scope.pending && !scope.dirty && scope.readLimit >= limit) {
                    if (delta) {
                        subscriber.previousView = scope.scans.slice(0, limit);
                        onSnapshot(JSON.stringify(encodeScanUpdate(null, subscriber.previousView)));
                    } else {
                        subscriber.previous = JSON.stringify({ scans: scope.scans });
                        onSnapshot(subscriber.previous);
                    }
                } else await (scope.pending || refresh(scope));
                return unsubscribe;
            } catch (error) { unsubscribe(); throw error; }
        },
    };
};

// Next.js can bundle API modules separately; retain a single hub across those bundles/HMR.
const hubKey = Symbol.for('sponsorenlauf.scanFeedHub.v5');
export const getScanFeedHub = () => globalThis[hubKey] ||= createScanFeedHub();
