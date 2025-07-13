/**
 * Service für Spenden-Operationen
 */

import { dbAll, dbGet, dbRun } from './database.js';

/**
 * Holt einen Schüler anhand seiner ID (nur für Spenden-Zwecke)
 * @param {number} studentId Schüler-ID
 * @returns {Promise<Object|null>} Schülerdaten oder null
 */
export const getStudentForDonation = async (studentId) => {
    return await dbGet('SELECT * FROM students WHERE id = ?', [studentId]);
};

/**
 * Setzt die erwartete Spende eines Schülers (überschreibt vorherige)
 * @param {number} studentId Schüler-ID
 * @param {number} amount Spendenbetrag
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const setExpectedDonation = async (studentId, amount) => {
    // Lösche alte erwartete Spende
    await dbRun('DELETE FROM expected_donations WHERE student_id = ?', [studentId]);

    // Füge neue erwartete Spende hinzu
    return await dbRun(
        'INSERT INTO expected_donations (student_id, amount) VALUES (?, ?)',
        [studentId, amount]
    );
};

/**
 * Fügt eine erhaltene Spende hinzu
 * @param {number} studentId Schüler-ID
 * @param {number} amount Spendenbetrag
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const addReceivedDonation = async (studentId, amount) => {
    return await dbRun(
        'INSERT INTO received_donations (student_id, amount) VALUES (?, ?)',
        [studentId, amount]
    );
};

/**
 * Löscht eine Spende
 * @param {number} donationId Spenden-ID
 * @param {string} type Spenden-Typ ('expected' oder 'received')
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const deleteDonation = async (donationId, type) => {
    const table = type === 'expected' ? 'expected_donations' : 'received_donations';
    return await dbRun(`DELETE FROM ${table} WHERE id = ?`, [donationId]);
};
