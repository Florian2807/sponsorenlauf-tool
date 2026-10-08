import React, { createContext, useContext } from 'react';
import { useApi } from '../hooks/useApi';
import { useModuleConfig } from './ModuleConfigContext';

const DonationDisplayModeContext = createContext();

export const DonationDisplayModeProvider = ({ children }) => {
    const { donationMode: mode, setDonationMode: setMode } = useModuleConfig();
    const { request } = useApi();

    // Modus ändern und im Backend speichern
    const updateMode = async (newMode) => {
        await request('/api/donationSettings', {
            method: 'POST',
            data: { donationDisplayMode: newMode },
        });
        setMode(newMode);
    };

    return (
        <DonationDisplayModeContext.Provider value={{ mode, updateMode }}>
            {children}
        </DonationDisplayModeContext.Provider>
    );
};

export const useDonationDisplayMode = () => useContext(DonationDisplayModeContext);
