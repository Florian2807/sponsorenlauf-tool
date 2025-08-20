import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const ModuleConfigContext = createContext();

export const ModuleConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        donations: true,
        emails: true,
        teachers: true
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
                    teachers: data.teachers !== false
                });
            } catch {
                // Fallback zu Standard-Konfiguration
                setConfig({
                    donations: true,
                    emails: true,
                    teachers: true
                });
            }
        };
        fetchConfig();
    }, [request]);

    // Konfiguration ändern und im Backend speichern
    const updateConfig = async (newConfig) => {
        setConfig(newConfig);
        try {
            await request('/api/moduleConfig', {
                method: 'POST',
                data: newConfig,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Fehler beim Speichern der Modul-Konfiguration:', error);
        }
    };

    const updateModule = async (module, enabled) => {
        const newConfig = { ...config, [module]: enabled };
        await updateConfig(newConfig);
    };

    return (
        <ModuleConfigContext.Provider value={{ 
            config, 
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
