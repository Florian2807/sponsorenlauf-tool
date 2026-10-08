import { useCallback, useEffect, useState } from 'react';

// Discovery refreshes only while choosing a laptop; the live view uses its SSE connection.
export const useScanDevices = (selectedId, enabled, choosing) => {
    const [state, setState] = useState({ devices: [], loading: true, error: '' });
    const [revision, setRevision] = useState(0);
    const refresh = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        if (!enabled) return;
        let stopped = false;
        let timer;
        let controller;
        let tag;
        const load = async () => {
            if (document.hidden) return;
            controller?.abort();
            controller = new AbortController();
            const signal = controller.signal;
            clearTimeout(timer);
            setState(current => ({ ...current, loading: true }));
            try {
                const params = selectedId ? `?selected=${encodeURIComponent(selectedId)}` : '';
                const response = await fetch(`/api/scan-devices${params}`, { signal, headers: tag ? { 'If-None-Match': tag } : {} });
                if (response.status === 304) { setState(current => ({ ...current, loading: false, error: '' })); return; }
                if (!response.ok) throw new Error('Scanner konnten nicht geladen werden.');
                const data = await response.json();
                tag = response.headers.get('ETag');
                if (!stopped && !signal.aborted) setState({ devices: data.devices, loading: false, error: '' });
            } catch (error) {
                if (!stopped && !signal.aborted) setState(current => ({ ...current, loading: false, error: error.message }));
            } finally {
                if (!stopped && !signal.aborted && choosing) timer = setTimeout(load, 10000);
            }
        };
        load();
        const visibility = () => { if (document.hidden) { clearTimeout(timer); controller?.abort(); } else load(); };
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('online', load);
        return () => { stopped = true; controller?.abort(); clearTimeout(timer); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('online', load); };
    }, [selectedId, enabled, choosing, revision]);
    return { ...state, refresh };
};
