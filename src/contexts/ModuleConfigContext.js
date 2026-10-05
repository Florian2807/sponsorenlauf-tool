import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const ModuleConfigContext = createContext();

export const ModuleConfigProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState({
        donations: true,
        emails: true,
        teachers: true,
        scannerStations: false
    });

    const { request } = useApi();

    // Initiale Konfiguration aus Backend laden
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await request('/api/moduleConfig');
                setConfig({
                    donations: data.donations !== false,
                    emails: data.emails !== false,
                    teachers: data.teachers !== false,
                    scannerStations: data.scannerStations === true,
                    doubleScanPrevention: data.doubleScanPrevention
                });
            } catch {
                // Fallback zu Standard-Konfiguration
                setConfig({
                    donations: true,
                    emails: true,
                    teachers: true,
                    scannerStations: false
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [request]);

    // Konfiguration ändern und im Backend speichern
    const updateConfig = async (newConfig) => {
        try {
            await request('/api/moduleConfig', {
                method: 'POST',
                data: newConfig,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setConfig(newConfig);
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
