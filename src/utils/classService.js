/**
 * Service für Klassen-Operationen
 */

import { dbAll, dbRun, dbTransaction } from './database.js';

/**
 * Holt die Klassenstruktur (gruppiert nach Jahrgängen)
 * @returns {Promise<Object>} Klassenstruktur
 */
export const getClassStructure = async () => {
    const rows = await dbAll('SELECT grade, class_name FROM classes ORDER BY id, class_name');

    return rows.reduce((structure, row) => {
        if (!structure[row.grade]) {
            structure[row.grade] = [];
        }
        structure[row.grade].push(row.class_name);
        return structure;
    }, {});
};

/**
 * Holt alle verfügbaren Klassennamen
 * @returns {Promise<Array>} Array von Klassennamen
 */
export const getAvailableClasses = async () => {
    const rows = await dbAll('SELECT DISTINCT class_name FROM classes ORDER BY id');
    return rows.map(row => row.class_name);
};

/**
 * Holt alle Klassen, die tatsächlich Schüler haben
 * @returns {Promise<Array>} Array von Klassennamen mit Schülern
 */
export const getClasses = async () => {
    const rows = await dbAll('SELECT class_name FROM classes ORDER BY grade, class_name');
    return rows.map(row => row.class_name);
};

/**
 * Aktualisiert die gesamte Klassenstruktur
 * @param {Object} availableClasses Neue Klassenstruktur (Jahrgang -> Klassen)
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const updateClassStructure = async (availableClasses) => {
    return await dbTransaction(async (db) => {
        // Lösche alte Klassenstruktur
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM classes', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Füge neue Klassenstruktur hinzu
        const stmt = db.prepare('INSERT INTO classes (grade, class_name) VALUES (?, ?)');

        for (const [grade, classes] of Object.entries(availableClasses)) {
            for (const className of classes) {
                await new Promise((resolve, reject) => {
                    stmt.run(grade, className, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }

        stmt.finalize();

        return {
            success: true,
            message: 'Klassenstruktur erfolgreich aktualisiert',
            availableClasses
        };
    });
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
        errors,
        availableClasses
    };
};
