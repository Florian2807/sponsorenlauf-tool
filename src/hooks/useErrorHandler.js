import { useCallback } from 'react';
import { useGlobalError } from '../contexts/ErrorContext';

/**
 * Zentraler Error-Handler Hook für konsistente Fehlerbehandlung
 * Verwendet den globalen ErrorContext für einheitliche Benachrichtigungen
 */
export const useErrorHandler = () => {
    const { showError, showSuccess, showNotification } = useGlobalError();

    /**
     * Verarbeitet einen Fehler und zeigt eine benutzerfreundliche Nachricht
     * @param {Error|string} error Der aufgetretene Fehler
     * @param {string} context Kontext in dem der Fehler aufgetreten ist
     */
    const handleError = useCallback((error, context = '') => {
        // Log für Entwickler
        console.error(`Error in ${context}:`, error);

        // Spezifische Behandlung für verschiedene Fehlertypen
        let userMessage = '';

        if (typeof error === 'string') {
            userMessage = error;
        } else if (error?.response?.data?.message) {
            userMessage = error.response.data.message;
        } else if (error?.response?.data?.errors?.length > 0) {
            userMessage = error.response.data.errors.join('\n');
        } else if (error?.message) {
            userMessage = error.message;
        } else {
            userMessage = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
        }

        // Spezifische Behandlung für verschiedene HTTP-Status-Codes
        if (error?.response?.status === 404) {
            userMessage = 'Die angeforderten Daten wurden nicht gefunden.';
        } else if (error?.response?.status === 401) {
            userMessage = 'Sie sind nicht berechtigt, diese Aktion auszuführen.';
        } else if (error?.response?.status === 403) {
            userMessage = 'Zugriff verweigert.';
        } else if (error?.response?.status >= 500) {
            userMessage = 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
        } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
            userMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
        }

        showError(userMessage, context);
        return userMessage;
    }, [showError]);

    /**
     * Zeigt eine Erfolgsmeldung an
     * @param {string} message Erfolgsmeldung
     * @param {string} context Kontext der Erfolgsmeldung
     */
    const handleSuccess = useCallback((message, context = '') => {
        showSuccess(message, context);
    }, [showSuccess]);

    /**
     * Wrapper für asynchrone Operationen mit automatischem Error-Handling
     * @param {Function} asyncOperation Die auszuführende asynchrone Operation
     * @param {string} context Kontext für Fehlerbehandlung
     * @param {Object} options Optionen für Error-Handling
     */
    const withErrorHandling = useCallback(async (asyncOperation, context = '', options = {}) => {
        const {
            showErrorToUser = true,
            rethrow = false,
            onError = null,
            onSuccess = null,
            successMessage = null
        } = options;

        try {
            const result = await asyncOperation();
            if (successMessage) {
                handleSuccess(successMessage, context);
            }
            if (onSuccess) onSuccess(result);
            return result;
        } catch (error) {
            if (showErrorToUser) {
                handleError(error, context);
            }
            if (onError) onError(error);
            if (rethrow) throw error;
            return null;
        }
    }, [handleError, handleSuccess]);

    return {
        handleError,
        handleSuccess,
        showError: handleError, // Alias für bessere Lesbarkeit
        showSuccess: handleSuccess, // Alias für bessere Lesbarkeit
        withErrorHandling,
        // Legacy support für bestehenden Code
        error: null,
        isErrorVisible: false,
        dismissError: () => {},
        clearError: () => {}
    };
};
