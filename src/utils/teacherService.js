/**
 * Service für Lehrer-Operationen
 */

import { dbAll, dbGet, dbRun } from './database.js';

/**
 * Holt einen Lehrer anhand seiner ID
 * @param {number} id Lehrer-ID
 * @returns {Promise<Object|null>} Lehrerdaten oder null
 */
export const getTeacherById = async (id) => {
    return await dbGet('SELECT * FROM teachers WHERE id = ?', [id]);
};

/**
 * Holt alle Lehrer
 * @returns {Promise<Array>} Array von Lehrerdaten
 */
export const getAllTeachers = async () => {
    return await dbAll('SELECT * FROM teachers ORDER BY nachname, vorname');
};

/**
 * Erstellt einen neuen Lehrer
 * @param {Object} teacherData Lehrerdaten
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const createTeacher = async (teacherData) => {
    const { id, vorname, nachname, klasse, email } = teacherData;

    return await dbRun(
        'INSERT INTO teachers (id, vorname, nachname, klasse, email) VALUES (?, ?, ?, ?, ?)',
        [id, vorname.trim(), nachname.trim(), klasse?.trim() || null, email.trim()]
    );
};

/**
 * Aktualisiert einen bestehenden Lehrer
 * @param {number} id Lehrer-ID
 * @param {Object} teacherData Neue Lehrerdaten
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const updateTeacher = async (id, teacherData) => {
    const { vorname, nachname, klasse, email } = teacherData;

    return await dbRun(
        'UPDATE teachers SET vorname = ?, nachname = ?, klasse = ?, email = ? WHERE id = ?',
        [vorname.trim(), nachname.trim(), klasse?.trim() || null, email.trim(), id]
    );
};

/**
 * Löscht einen Lehrer
 * @param {number} id Lehrer-ID
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const deleteTeacher = async (id) => {
    return await dbRun('DELETE FROM teachers WHERE id = ?', [id]);
};

/**
 * Weist Lehrer zu Klassen zu
 * @param {Object} classAssignments Objekt mit Klassen-Zuweisungen
 * @returns {Promise<Array>} Aktualisierte Lehrerliste
 */
export const assignTeachersToClasses = async (classAssignments) => {
    const assignments = Object.entries(classAssignments)
        .flatMap(([klasse, teachers]) =>
            teachers.map(teacher => ({ id: teacher.id, klasse }))
        );

    // Setze zuerst alle Lehrer-Klassen auf null
    await dbRun('UPDATE teachers SET klasse = NULL');

    // Weise neue Klassen zu
    for (const { id, klasse } of assignments) {
        await dbRun('UPDATE teachers SET klasse = ? WHERE id = ?', [klasse, id]);
    }

    // Gebe aktualisierte Lehrerliste zurück
    return await getAllTeachers();
};
