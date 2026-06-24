/**
 * Service für Klassen-Operationen
 */

import { dbAll, dbRun } from './database.js';
import { getSetting, setSetting } from './settingsService.js';

export const sanitizeClassName = (className) => {
    const trimmedClassName = String(className || '').trim();

    if (!trimmedClassName) {
        return '';
    }

    const classMatch = trimmedClassName.match(/^0*(\d+)(.*)$/);

    if (!classMatch) {
        return trimmedClassName;
    }

    const [, numericPart, suffix = ''] = classMatch;
    return `${parseInt(numericPart, 10)}${suffix}`;
};

export const normalizeClassNameForComparison = (className) => {
    return sanitizeClassName(className).toLowerCase();
};

export const resolveCanonicalClassName = (className, availableClasses = []) => {
    const sanitizedClassName = sanitizeClassName(className);

    if (!sanitizedClassName) {
        return '';
    }

    const normalizedInput = normalizeClassNameForComparison(sanitizedClassName);
    const canonicalClassName = availableClasses.find((availableClass) => (
        normalizeClassNameForComparison(availableClass) === normalizedInput
    ));

    return canonicalClassName || sanitizedClassName;
};

const deriveGradeFromClassName = (className) => {
    const normalizedClassName = sanitizeClassName(className);
    const gradeMatch = normalizedClassName.match(/^\d+/);

    if (gradeMatch) {
        return gradeMatch[0];
    }

    return 'Sonstige';
};

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

    if (classes.length > 0) {
        return classes;
    }

    const existingClasses = await dbAll("SELECT DISTINCT klasse FROM students WHERE klasse IS NOT NULL AND TRIM(klasse) != '' ORDER BY klasse");
    return existingClasses.map((row) => row.klasse);
};

/**
 * Erstellt eine Map Klasse -> Jahrgang aus der gespeicherten Klassenstruktur
 * @returns {Promise<Object<string, string>>} Zuordnung Klasse zu Jahrgang
 */
export const getClassGradeMap = async () => {
    const structure = await getClassStructure();
    const gradeMap = {};

    Object.entries(structure).forEach(([grade, classes]) => {
        if (!Array.isArray(classes)) return;

        classes.forEach((className) => {
            gradeMap[className] = grade;
        });
    });

    return gradeMap;
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
        await syncClassesToDatabase(availableClasses);

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
        const resolvedClassName = resolveCanonicalClassName(className, availableClasses);

        if (!availableClasses.includes(resolvedClassName)) {
            errors.push(`Ungültige Klasse: ${className}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
};

export const syncClassesToDatabase = async (structure = null) => {
    const classStructure = structure || await getClassStructure();

    for (const [grade, classes] of Object.entries(classStructure)) {
        if (!Array.isArray(classes)) continue;

        for (const className of classes) {
            const normalizedClassName = String(className || '').trim();
            if (!normalizedClassName) continue;

            await dbRun(
                'INSERT OR IGNORE INTO classes (grade, class_name) VALUES (?, ?)',
                [String(grade || deriveGradeFromClassName(normalizedClassName)).trim(), normalizedClassName]
            );
        }
    }
};

export const ensureClassExists = async (className) => {
    const normalizedClassName = sanitizeClassName(className);

    if (!normalizedClassName) {
        return;
    }

    const gradeMap = await getClassGradeMap();
    const canonicalClassName = resolveCanonicalClassName(normalizedClassName, Object.keys(gradeMap));
    const grade = gradeMap[canonicalClassName] || deriveGradeFromClassName(canonicalClassName);

    await dbRun(
        'INSERT OR IGNORE INTO classes (grade, class_name) VALUES (?, ?)',
        [grade, canonicalClassName]
    );
};

export const syncClassNamesFromList = async (classNames = []) => {
    for (const className of classNames) {
        await ensureClassExists(className);
    }
};
