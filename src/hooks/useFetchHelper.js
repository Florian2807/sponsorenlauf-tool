import { useCallback } from 'react';
import { useApi } from './useApi';
import { useGlobalError } from '../contexts/ErrorContext';

/**
 * Custom Hook für typische Fetch-Operationen
 * Reduziert Boilerplate-Code für Standard-API-Aufrufe
 */
export const useFetchHelper = () => {
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();

    /**
     * Erstellt eine einfache Fetch-Funktion
     * @param {string} endpoint API-Endpoint
     * @param {Function} setState State-Setter-Funktion
     * @param {string} errorContext Kontext für Fehlermeldungen
     * @returns {Function} Fetch-Funktion
     */
    const createFetcher = useCallback((endpoint, setState, errorContext) => {
        return async () => {
            try {
                const data = await request(endpoint, { errorContext });
                setState(data);
                return data;
            } catch (error) {
                // Fehler wird automatisch über useApi gehandelt
                return null;
            }
        };
    }, [request]);

    /**
     * Erstellt eine CRUD-Operation
     * @param {string} endpoint API-Endpoint
     * @param {string} method HTTP-Method
     * @param {Function} onSuccess Success-Callback
     * @param {string} successMessage Erfolgsmeldung
     * @param {string} errorContext Kontext für Fehlermeldungen
     * @returns {Function} CRUD-Funktion
     */
    const createCrudOperation = useCallback((endpoint, method, onSuccess, successMessage, errorContext) => {
        return async (data) => {
            try {
                const result = await request(endpoint, {
                    method,
                    data,
                    errorContext
                });

                if (successMessage) {
                    showSuccess(successMessage);
                }

                if (onSuccess) {
                    onSuccess(result);
                }

                return result;
            } catch (error) {
                // Fehler wird automatisch über useApi gehandelt
                return null;
            }
        };
    }, [request, showSuccess]);

    return {
        createFetcher,
        createCrudOperation
    };
};
