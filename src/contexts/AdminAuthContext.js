import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
    const [configured, setConfigured] = useState(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const response = await axios.get('/api/admin-auth', { timeout: 5000 });
            setConfigured(Boolean(response.data?.data?.configured));
            setAuthenticated(Boolean(response.data?.data?.authenticated));
            return response.data?.data;
        } catch {
            setAuthenticated(false);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await axios.post('/api/admin-auth', { action: 'logout' });
        setAuthenticated(false);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const value = useMemo(() => ({
        configured,
        authenticated,
        loading,
        refresh,
        logout,
    }), [authenticated, configured, loading, logout, refresh]);

    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) throw new Error('useAdminAuth muss innerhalb von AdminAuthProvider verwendet werden');
    return context;
};
