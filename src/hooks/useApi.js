import { useState, useCallback } from 'react';
import axios from 'axios';

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (url, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios({
                url,
                method: 'GET',
                ...options
            });
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Ein Fehler ist aufgetreten';
            setError(errorMessage);
            console.error('API Error:', err);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    return { request, loading, error, setError };
};
