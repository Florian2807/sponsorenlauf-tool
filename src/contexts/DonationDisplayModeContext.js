import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const DonationDisplayModeContext = createContext();

export const DonationDisplayModeProvider = ({ children }) => {
    const [mode, setMode] = useState('expected');
    const { request } = useApi();

    // Initiale Einstellung aus Backend laden
    useEffect(() => {
        const fetchMode = async () => {
            try {
                const data = await request('/api/donationSettings');
                setMode(data.donationDisplayMode || 'expected');
            } catch {
                setMode('expected');
            }
        };
        fetchMode();
    }, [request]);

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
