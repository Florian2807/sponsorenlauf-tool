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
            `INSERT INTO settings (key, value, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
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

/**
 * Holt die Modul-Konfiguration aus der Datenbank
 * @returns {Promise<Object>} Die Modul-Konfiguration mit Standard-Werten
 */
export const getModuleConfig = async () => {
    try {
        const moduleConfig = await getSetting('module_config', {});
        
        // Standard-Werte für fehlende Module ergänzen
        return {
            donations: moduleConfig.donations ?? false,
            emails: moduleConfig.emails ?? false,
            teachers: moduleConfig.teachers ?? false,
            roundDisplay: moduleConfig.roundDisplay ?? true,
            doubleScanPrevention: {
                enabled: moduleConfig.doubleScanPrevention?.enabled ?? true,
                timeThresholdMinutes: moduleConfig.doubleScanPrevention?.timeThresholdMinutes ?? 5,
                mode: moduleConfig.doubleScanPrevention?.mode ?? 'confirm',
            }
        };
    } catch (error) {
        console.error('Fehler beim Abrufen der Modul-Konfiguration:', error);
        // Fallback auf Standard-Werte
        return {
            donations: false,
            emails: false,
            teachers: false,
            roundDisplay: true,
            doubleScanPrevention: {
                enabled: true,
                timeThresholdMinutes: 5,
                mode: 'confirm'
            }
        };
    }
};


