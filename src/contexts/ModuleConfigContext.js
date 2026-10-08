import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';

const ModuleConfigContext = createContext();

export const ModuleConfigProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({
        donations: false,
        emails: false,
        teachers: false,
        roundDisplay: true,
        doubleScanPrevention: { enabled: true, timeThresholdMinutes: 5, mode: 'confirm' }
    });

    const { request } = useApi();
    const [donationMode, setDonationMode] = useState('expected');
    const [setupCompleted, setSetupCompleted] = useState(null);
    const refresh = useCallback(async () => {
        try {
            const data = await request('/api/client-config');
            setConfig(current => JSON.stringify(current) === JSON.stringify(data.config) ? current : data.config);
            setDonationMode(data.donationMode);
            setSetupCompleted(data.setupCompleted);
        } catch { /* Keep the last known configuration during connection failures. */ }
        finally { setIsLoading(false); }
    }, [request]);

    useEffect(() => {
        refresh();
        let timer;
        const changed = () => { clearTimeout(timer); timer = setTimeout(refresh, 100); };
        window.addEventListener('sponsorenlauf:settings-changed', changed);
        window.addEventListener('focus', changed);
        return () => { clearTimeout(timer); window.removeEventListener('sponsorenlauf:settings-changed', changed); window.removeEventListener('focus', changed); };
    }, [refresh]);

    // Konfiguration ändern und im Backend speichern
    const updateConfig = async (newConfig) => {
        try {
            const saved = await request('/api/moduleConfig', {
                method: 'POST',
                data: newConfig,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setConfig(saved.modules);
        } catch (error) {
            console.error('Fehler beim Speichern der Modul-Konfiguration:', error);
            throw error;
        }
    };

    const updateModule = async (module, enabled) => {
        const newConfig = { ...config, [module]: enabled };
        await updateConfig(newConfig);
    };

    return (
        <ModuleConfigContext.Provider value={{
            config,
            isLoading,
            donationMode, setDonationMode, setupCompleted, refresh,
            updateConfig,
            updateModule,
            isDonationsEnabled: config.donations,
            isEmailsEnabled: config.emails,
            isTeachersEnabled: config.teachers
        }}>
            {children}
        </ModuleConfigContext.Provider>
    );
};

export const useModuleConfig = () => useContext(ModuleConfigContext);
