import { useState, useCallback } from 'react';
import axios from 'axios';
import { useGlobalError } from '../contexts/ErrorContext';

const ERROR_MESSAGES = {
    400: 'Ungültige Anfrage',
    401: 'Nicht autorisiert',
    403: 'Zugriff verweigert',
    404: 'Nicht gefunden',
    409: 'Konflikt - Daten bereits vorhanden',
    422: 'Validierungsfehler',
    429: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
    500: 'Serverfehler. Bitte versuchen Sie es später erneut.',
    502: 'Server nicht erreichbar',
    503: 'Service vorübergehend nicht verfügbar'
};

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const { showError } = useGlobalError();

    const request = useCallback(async (url, options = {}) => {
        setLoading(true);

        try {
            const response = await axios({
                url,
                method: 'GET',
                timeout: 30000,
                ...options
            });

            // Handle API response format
            if (response.data?.hasOwnProperty('success')) {
                if (!response.data.success) {
                    throw new Error(response.data.message || 'API-Fehler');
                }
                return response.data.data !== undefined ? response.data.data : response.data;
            }

            return response.data;
        } catch (err) {
            let errorMessage = 'Ein Fehler ist aufgetreten';

            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Die Anfrage dauerte zu lange. Bitte versuchen Sie es erneut.';
            } else if (err.response) {
                const { status, data } = err.response;
                errorMessage = data?.message ||
                    (data?.errors?.length > 0 ? data.errors.join('\n') : null) ||
                    ERROR_MESSAGES[status] ||
                    (status >= 500 ? 'Serverfehler. Bitte versuchen Sie es später erneut.' : errorMessage);
            } else if (err.request) {
                errorMessage = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.';
            } else {
                errorMessage = err.message || 'Unbekannter Fehler';
            }

            // Show error automatically unless disabled
            if (options.showErrorMessage !== false) {
                showError(errorMessage, options.errorContext || `API-Request zu ${url}`);
            }

            const enhancedError = new Error(errorMessage);
            enhancedError.originalError = err;
            enhancedError.response = err.response;
            enhancedError.status = err.response?.status;

            throw enhancedError;
        } finally {
            setLoading(false);
        }
    }, [showError]);

    return { request, loading };
};
