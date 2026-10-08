import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { createClientId } from '../utils/clientId';

const ScannerStationContext = createContext();

export function ScannerStationProvider({ children, active = true }) {
    const { request } = useApi();
    const [deviceId, setDeviceId] = useState(null);
    const [data, setData] = useState({ stations: [], classes: [], grades: [] });
    const [error, setError] = useState('');
    const refresh = useCallback(async () => {
        if (!active || !deviceId) return;
        try {
            setData(await request(`/api/scanner-rules?deviceId=${encodeURIComponent(deviceId)}`, { showErrorMessage: false }));
            setError('');
        } catch (error) { setError(error.message); }
    }, [active, deviceId, request]);
    useEffect(() => {
        if (!active) return;
        try {
            let id = localStorage.getItem('sponsorenlauf.deviceId');
            if (!id) {
                id = createClientId('device');
                localStorage.setItem('sponsorenlauf.deviceId', id);
            }
            setDeviceId(id);
            localStorage.removeItem('sponsorenlauf.scannerStation');
        } catch { setError('Browserdaten konnten nicht gelesen werden.'); }
    }, [active]);
    useEffect(() => {
        if (!active || !deviceId) return;
        refresh();
        window.addEventListener('sponsorenlauf:settings-changed', refresh);
        window.addEventListener('focus', refresh);
        return () => {
            window.removeEventListener('sponsorenlauf:settings-changed', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, [active, deviceId, refresh]);
    return <ScannerStationContext.Provider value={{ enabled: true, ...data, error, refresh, deviceId, stationId: deviceId ? `rules_${deviceId}` : null }}>
        {children}
    </ScannerStationContext.Provider>;
}

export const useScannerStation = () => useContext(ScannerStationContext);
