import { dbGet, dbRun, dbAll } from './database.js';

/**
 * Utility-Funktionen für das Settings-System in der Datenbank
 */

/**
 * Holt eine einzelne Einstellung aus der Datenbank
 * @param {string} key - Der Einstellungsschlüssel
 * @param {*} defaultValue - Standardwert falls Einstellung nicht existiert
 * @returns {Promise<*>} Der Wert der Einstellung
 */
export const getSetting = async (key, defaultValue = null) => {
    try {
        const result = await dbGet('SELECT value FROM settings WHERE key = ?', [key]);
        if (result && result.value !== null) {
            // Versuche JSON zu parsen, falls es sich um ein Objekt handelt
            try {
                return JSON.parse(result.value);
            } catch {
                // Falls es kein JSON ist, gib den Wert direkt zurück
                return result.value;
            }
        }
        return defaultValue;
    } catch (error) {
        console.error(`Fehler beim Abrufen der Einstellung '${key}':`, error);
        return defaultValue;
    }
};

/**
 * Speichert eine Einstellung in der Datenbank
 * @param {string} key - Der Einstellungsschlüssel
 * @param {*} value - Der zu speichernde Wert
 * @returns {Promise<boolean>} True wenn erfolgreich gespeichert
 */
export const setSetting = async (key, value) => {
    try {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

        await dbRun(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [key, serializedValue]
        );

        return true;
    } catch (error) {
        console.error(`Fehler beim Speichern der Einstellung '${key}':`, error);
        throw error;
    }
};

/**
 * Holt mehrere Einstellungen auf einmal
 * @param {string[]} keys - Array von Einstellungsschlüsseln
 * @returns {Promise<Object>} Objekt mit key-value Paaren
 */
export const getSettings = async (keys) => {
    try {
        const placeholders = keys.map(() => '?').join(',');
        const results = await dbAll(
            `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
            keys
        );

        const settings = {};
        results.forEach(row => {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        });

        return settings;
    } catch (error) {
        console.error('Fehler beim Abrufen mehrerer Einstellungen:', error);
        return {};
    }
};

/**
 * Speichert mehrere Einstellungen auf einmal
 * @param {Object} settings - Objekt mit key-value Paaren
 * @returns {Promise<boolean>} True wenn erfolgreich gespeichert
 */
export const setSettings = async (settings) => {
    try {
        const entries = Object.entries(settings);

        for (const [key, value] of entries) {
            await setSetting(key, value);
        }

        return true;
    } catch (error) {
        console.error('Fehler beim Speichern mehrerer Einstellungen:', error);
        throw error;
    }
};

/**
 * Löscht eine Einstellung aus der Datenbank
 * @param {string} key - Der Einstellungsschlüssel
 * @returns {Promise<boolean>} True wenn erfolgreich gelöscht
 */
export const deleteSetting = async (key) => {
    try {
        await dbRun('DELETE FROM settings WHERE key = ?', [key]);
        return true;
    } catch (error) {
        console.error(`Fehler beim Löschen der Einstellung '${key}':`, error);
        throw error;
    }
};

/**
 * Holt alle Einstellungen aus der Datenbank
 * @returns {Promise<Object>} Alle Einstellungen als Objekt
 */
export const getAllSettings = async () => {
    try {
        const results = await dbAll('SELECT key, value FROM settings ORDER BY key');

        const settings = {};
        results.forEach(row => {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        });

        return settings;
    } catch (error) {
        console.error('Fehler beim Abrufen aller Einstellungen:', error);
        return {};
    }
};




