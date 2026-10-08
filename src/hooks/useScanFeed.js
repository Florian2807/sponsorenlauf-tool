import { useEffect, useState } from 'react';
import { applyScanUpdate } from '../utils/scanFeedProtocol';

export const useScanFeed = (deviceId, enabled = true, view = 'history') => {
    const [feed, setFeed] = useState({ scans: [], status: 'connecting', deviceId: deviceId || null });
    useEffect(() => {
        if (!enabled) return;
        setFeed({ scans: [], status: 'connecting', deviceId: deviceId || null });
        const params = new URLSearchParams({ stream: '1' });
        if (deviceId) params.set('device', deviceId);
        if (view !== 'history') params.set('view', view);
        let source;
        let watchdog;
        let reconnect;
        let stopped = false;
        const markOffline = () => setFeed(current => ({ ...current, status: 'offline' }));
        const close = () => { clearTimeout(watchdog); clearTimeout(reconnect); source?.close(); source = null; };
        const connect = () => {
            close();
            if (stopped || !navigator.onLine) { markOffline(); return; }
            const connection = new EventSource(`/api/scan-feed?${params}`);
            source = connection;
            const heard = () => {
                clearTimeout(watchdog);
                watchdog = setTimeout(() => {
                    close(); markOffline(); reconnect = setTimeout(connect, 2000);
                }, 35000);
            };
            heard();
            connection.addEventListener('heartbeat', heard);
            connection.addEventListener('settings-change', () => {
                if (stopped || source !== connection) return;
                heard();
                window.dispatchEvent(new CustomEvent('sponsorenlauf:settings-changed'));
            });
            connection.addEventListener('device-update', event => {
                if (stopped || source !== connection) return;
                heard();
                try {
                    const data = JSON.parse(event.data);
                    if (data.device && (!deviceId || data.device.id === deviceId)) setFeed(current => ({ ...current, deviceMetadata: data.device,
                        scans: current.scans.map(scan => scan.deviceId === data.device.id ? { ...scan, deviceName: data.device.name } : scan) }));
                } catch { /* Keep the last known device name. */ }
            });
            connection.addEventListener('student-change', event => {
                if (stopped || source !== connection) return;
                heard();
                try {
                    const data = JSON.parse(event.data);
                    if (Array.isArray(data.studentIds)) setFeed(current => ({ ...current, studentChange: { ids: data.studentIds, revision: (current.studentChange?.revision || 0) + 1 } }));
                } catch { /* Ignore malformed invalidations. */ }
            });
            connection.addEventListener('scan-error', event => {
                if (stopped || source !== connection) return;
                heard();
                try {
                    const data = JSON.parse(event.data);
                    if (typeof data.errorId === 'string') setFeed(current => ({
                        ...current,
                        errorId: data.errorId,
                        clearedThroughScanId: Math.max(current.clearedThroughScanId || 0, current.scans[0]?.id || 0),
                    }));
                } catch { /* Ignore malformed feedback; keep the last confirmed scan. */ }
            });
            connection.onmessage = (event) => {
                if (stopped || source !== connection) return;
                heard();
                try {
                    const data = JSON.parse(event.data);
                    if (Array.isArray(data.scans) || data.type === 'patch') setFeed(current => ({ ...current,
                        scans: applyScanUpdate(current.scans, data), status: 'live', errorId: undefined }));
                } catch { markOffline(); }
            };
            connection.onerror = () => {
                if (stopped || source !== connection) return;
                clearTimeout(watchdog); markOffline();
                // EventSource retries interrupted requests automatically.
            };
        };
        const offline = () => { close(); markOffline(); };
        window.addEventListener('offline', offline);
        window.addEventListener('online', connect);
        connect();
        return () => {
            stopped = true; close();
            window.removeEventListener('offline', offline);
            window.removeEventListener('online', connect);
        };
    }, [deviceId, enabled, view]);
    return feed.deviceId === (deviceId || null) ? feed : { scans: [], status: 'connecting' };
};
