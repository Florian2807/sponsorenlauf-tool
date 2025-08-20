/**
 * Service für Klassen-Operationen
 */

import { dbAll, dbRun, dbTransaction } from './database.js';
import { getSetting, setSetting } from './settingsService.js';

/**
 * Holt die Klassenstruktur (gruppiert nach Jahrgängen)
 * @returns {Promise<Object>} Klassenstruktur
 */
export const getClassStructure = async () => {
    // Hole Klassenstruktur aus den Settings
    const structure = await getSetting('class_structure', {});
    return structure;
};

/**
 * Holt alle verfügbaren Klassennamen aus der Klassenstruktur
 * @returns {Promise<Array>} Array von Klassennamen
 */
export const getAvailableClasses = async () => {
    const structure = await getClassStructure();
    const classes = [];
    
    for (const grade in structure) {
        if (Array.isArray(structure[grade])) {
            classes.push(...structure[grade]);
        }
    }
    
    return classes.sort();
};

/**
 * Holt alle Klassen, die tatsächlich Schüler haben
 * @returns {Promise<Array>} Array von Klassennamen mit Schülern
 */
export const getClasses = async () => {
    // Für Kompatibilität mit bestehenden Funktionen
    return await getAvailableClasses();
};

/**
 * Aktualisiert die gesamte Klassenstruktur
 * @param {Object} availableClasses Neue Klassenstruktur (Jahrgang -> Klassen)
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const updateClassStructure = async (availableClasses) => {
    try {
        await setSetting('class_structure', availableClasses);
        
        return {
            success: true,
            message: 'Klassenstruktur erfolgreich aktualisiert',
            availableClasses
        };
    } catch (error) {
        throw new Error('Fehler beim Speichern der Klassenstruktur: ' + error.message);
    }
};

/**
 * Validiert, ob alle Klassennamen in der verfügbaren Struktur existieren
 * @param {Array<string>} classNames Zu validierende Klassennamen
 * @returns {Promise<Object>} Validierungsergebnis
 */
export const validateClassNames = async (classNames) => {
    if (!classNames || classNames.length === 0) {
        return { valid: true, errors: [] };
    }

    const availableClasses = await getAvailableClasses();
    const errors = [];

    classNames.forEach(className => {
        if (!availableClasses.includes(className)) {
            errors.push(`Ungültige Klasse: ${className}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};
