import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useModuleConfig } from './ModuleConfigContext';
import { useApi } from '../hooks/useApi';

const ScannerStationContext = createContext();
const STORAGE_KEY = 'sponsorenlauf.scannerStation';

export function ScannerStationProvider({ children }) {
    const { config } = useModuleConfig();
    const enabled = config.scannerStations === true;
    const { request } = useApi();
    const [selectedId, setSelectedId] = useState('default');
    const [data, setData] = useState({ stations: [], classes: [], grades: [] });
    const [error, setError] = useState('');
    const refresh = useCallback(async () => {
        if (!enabled) return;
        try {
            setData(await request('/api/stations', { showErrorMessage: false }));
            setError('');
        } catch (error) {
            setError(error.message);
        }
    }, [enabled, request]);

    useEffect(() => {
        try { setSelectedId(localStorage.getItem(STORAGE_KEY) || 'default'); } catch {}
    }, []);
    useEffect(() => {
        if (!enabled) return;
        refresh();
        const timer = setInterval(refresh, 15000);
        window.addEventListener('focus', refresh);
        return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
    }, [enabled, refresh]);

    // Preserve the stored selection while station metadata is still loading.
    const stationId = !data.stations.length || data.stations.some((station) => station.id === selectedId) ? selectedId : 'default';
    const selectStation = (id) => {
        setSelectedId(id);
        try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    };
    return <ScannerStationContext.Provider value={{ enabled, ...data, error, refresh, stationId, selectStation }}>
        {children}
    </ScannerStationContext.Provider>;
}

export const useScannerStation = () => useContext(ScannerStationContext);
