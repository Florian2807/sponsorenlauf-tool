import React, { createContext, useContext } from 'react';
import { useApi } from '../hooks/useApi';
import { useModuleConfig } from './ModuleConfigContext';

const DonationDisplayModeContext = createContext();

export const DonationDisplayModeProvider = ({ children }) => {
    const { donationMode: mode, setDonationMode: setMode } = useModuleConfig();
    const { request } = useApi();

    // Modus ändern und im Backend speichern
    const updateMode = async (newMode) => {
        setMode(newMode);
        try {
            await request('/api/donationSettings', {
                method: 'POST',
                data: { donationDisplayMode: newMode },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Fehler beim Speichern des Donation Display Mode:', error);
            // Optional: Rollback bei Fehler
            // setMode(previousMode);
        }
    };

    return (
        <DonationDisplayModeContext.Provider value={{ mode, updateMode }}>
            {children}
        </DonationDisplayModeContext.Provider>
    );
};

export const useDonationDisplayMode = () => useContext(DonationDisplayModeContext);
