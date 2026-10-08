import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useScannerStation } from '../contexts/ScannerStationContext';

export function useScannerDevice(enabled) {
    const { deviceId } = useScannerStation();
    const [device, setDevice] = useState(null);
    const [error, setError] = useState('');
    const controllerRef = useRef(null);
    const nameRevision = useRef(0);
    const refreshDevice = useCallback(async () => {
        if (!enabled || !deviceId) return;
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        const revision = nameRevision.current;
        try {
            const response = await axios.post('/api/stations/heartbeat', { deviceId },
                { timeout: 5000, signal: controller.signal });
            if (!controller.signal.aborted) {
                if (revision === nameRevision.current) setDevice(response.data.data.device);
                setError('');
            }
        } catch {
            if (!controller.signal.aborted) setError('Scanner konnte nicht geladen werden.');
        }
    }, [enabled, deviceId]);
    useEffect(() => {
        if (!enabled || !deviceId) return;
        refreshDevice();
        const interval = setInterval(refreshDevice, 30000);
        return () => { clearInterval(interval); controllerRef.current?.abort(); };
    }, [enabled, deviceId, refreshDevice]);
    const updateDevice = useCallback(device => {
        nameRevision.current += 1;
        setDevice(device);
        setError('');
    }, []);
    return { deviceId, device, error, refreshDevice, updateDevice };
}
