import { useState, useCallback } from 'react';

export const useAsyncOperation = (initialLoadingState = {}) => {
    const [loading, setLoading] = useState(initialLoadingState);
    const [message, setMessage] = useState('');

    const executeAsync = useCallback(async (operation, loadingKey, successMessage = '') => {
        setLoading(prev => ({ ...prev, [loadingKey]: true }));
        setMessage('');

        try {
            const result = await operation();
            if (successMessage) {
                setMessage(successMessage);
            }
            return result;
        } catch (error) {
            console.error(`Error in ${loadingKey}:`, error);
            setMessage(`Fehler: ${error.message}`);
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
    }, []);

    const setLoadingState = useCallback((loadingKey, state) => {
        setLoading(prev => ({ ...prev, [loadingKey]: state }));
    }, []);

    return {
        loading,
        message,
        setMessage,
        executeAsync,
        setLoadingState
    };
};
