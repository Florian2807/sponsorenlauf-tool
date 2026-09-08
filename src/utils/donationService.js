/**
 * Service für Spenden-Operationen
 */

import { dbAll, dbGet, dbRun, dbImmediateTransaction } from './database.js';

const run = (db, query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function (error) {
        if (error) reject(error);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
});

/**
 * Holt einen Schüler anhand seiner ID (nur für Spenden-Zwecke)
 * @param {number} studentId Schüler-ID
 * @returns {Promise<Object|null>} Schülerdaten oder null
 */
export const getStudentForDonation = async (studentId) => {
    return await dbGet('SELECT * FROM students WHERE id = ?', [studentId]);
};

export const getStudentDonationDetails = async (studentId) => {
    const student = await getStudentForDonation(studentId);
    if (!student) return null;

    const [expectedDonations, receivedDonations] = await Promise.all([
        dbAll('SELECT id, amount, created_at FROM expected_donations WHERE student_id = ? ORDER BY created_at DESC', [studentId]),
        dbAll('SELECT id, amount, created_at FROM received_donations WHERE student_id = ? ORDER BY created_at DESC', [studentId])
    ]);

    return {
        ...student,
        spenden: expectedDonations.reduce((sum, donation) => sum + donation.amount, 0),
        spendenKonto: receivedDonations.map((donation) => donation.amount),
        expectedDonations,
        receivedDonations
    };
};

/**
 * Setzt die erwartete Spende eines Schülers (überschreibt vorherige)
 * @param {number} studentId Schüler-ID
 * @param {number} amount Spendenbetrag
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const setExpectedDonation = async (studentId, amount) => {
    return dbImmediateTransaction(async (db) => {
        await run(db, 'DELETE FROM expected_donations WHERE student_id = ?', [studentId]);
        return run(db, 'INSERT INTO expected_donations (student_id, amount) VALUES (?, ?)', [studentId, amount]);
    });
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
