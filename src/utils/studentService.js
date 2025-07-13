/**
 * Service für Schüler-Operationen
 */

import { dbAll, dbGet, dbRun, dbTransaction, createPlaceholders } from './database.js';

/**
 * Holt einen Schüler anhand seiner ID
 * @param {number} id Schüler-ID
 * @returns {Promise<Object|null>} Schülerdaten oder null
 */
export const getStudentById = async (id) => {
    const student = await dbGet('SELECT * FROM students WHERE id = ?', [id]);

    if (!student) return null;

    // Lade zusätzliche Daten
    const [replacements, rounds, expectedDonations, receivedDonations] = await Promise.all([
        getReplacementsByStudentId(id),
        getRoundsByStudentId(id),
        getExpectedDonationsByStudentId(id),
        getReceivedDonationsByStudentId(id)
    ]);

    return {
        ...student,
        replacements,
        timestamps: rounds,
        spenden: expectedDonations.reduce((sum, d) => sum + d.amount, 0),
        spendenKonto: receivedDonations.map(d => d.amount)
    };
};

/**
 * Erstellt einen neuen Schüler
 * @param {Object} studentData Schülerdaten
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const createStudent = async (studentData) => {
    const { id, vorname, nachname, klasse, geschlecht } = studentData;

    return await dbRun(
        'INSERT INTO students (id, vorname, nachname, klasse, geschlecht) VALUES (?, ?, ?, ?, ?)',
        [id, vorname.trim(), nachname.trim(), klasse.trim(), geschlecht || null]
    );
};

/**
 * Aktualisiert einen bestehenden Schüler
 * @param {number} id Schüler-ID
 * @param {Object} studentData Neue Schülerdaten
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const updateStudent = async (id, studentData) => {
    const { vorname, nachname, klasse, geschlecht } = studentData;

    return await dbRun(
        'UPDATE students SET vorname = ?, nachname = ?, klasse = ?, geschlecht = ? WHERE id = ?',
        [vorname.trim(), nachname.trim(), klasse.trim(), geschlecht || null, id]
    );
};

/**
 * Löscht einen Schüler
 * @param {number} id Schüler-ID
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const deleteStudent = async (id) => {
    return await dbTransaction(async (db) => {
        // Lösche abhängige Daten in der richtigen Reihenfolge
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM replacements WHERE studentID = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM rounds WHERE student_id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM expected_donations WHERE student_id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM received_donations WHERE student_id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM students WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });

        return result;
    });
};

/**
 * Holt alle Schüler mit vollständigen Daten
 * @returns {Promise<Array>} Array von Schülerdaten
 */
export const getAllStudents = async () => {
    const students = await dbAll('SELECT * FROM students ORDER BY klasse, nachname');

    if (students.length === 0) return [];

    const studentIds = students.map(s => s.id);
    const placeholders = createPlaceholders(studentIds);

    // Lade alle zusätzlichen Daten parallel
    const [replacements, rounds, expectedDonations, receivedDonations] = await Promise.all([
        dbAll(`SELECT studentID, id FROM replacements WHERE studentID IN (${placeholders})`, studentIds),
        dbAll(`SELECT student_id, timestamp FROM rounds WHERE student_id IN (${placeholders}) ORDER BY student_id, timestamp DESC`, studentIds),
        dbAll(`SELECT student_id, SUM(amount) as total FROM expected_donations WHERE student_id IN (${placeholders}) GROUP BY student_id`, studentIds),
        dbAll(`SELECT student_id, amount FROM received_donations WHERE student_id IN (${placeholders}) ORDER BY student_id, created_at DESC`, studentIds)
    ]);

    // Erstelle Maps für effiziente Zuordnung
    const replacementsMap = replacements.reduce((acc, { studentID, id }) => {
        if (!acc[studentID]) acc[studentID] = [];
        acc[studentID].push(id);
        return acc;
    }, {});

    const roundsMap = rounds.reduce((acc, { student_id, timestamp }) => {
        if (!acc[student_id]) acc[student_id] = [];
        acc[student_id].push(timestamp);
        return acc;
    }, {});

    const expectedMap = expectedDonations.reduce((acc, { student_id, total }) => {
        acc[student_id] = total;
        return acc;
    }, {});

    const receivedMap = receivedDonations.reduce((acc, { student_id, amount }) => {
        if (!acc[student_id]) acc[student_id] = [];
        acc[student_id].push(amount);
        return acc;
    }, {});

    // Kombiniere alle Daten
    return students.map(student => ({
        ...student,
        replacements: replacementsMap[student.id] || [],
        timestamps: roundsMap[student.id] || [],
        spenden: expectedMap[student.id] || 0,
        spendenKonto: receivedMap[student.id] || []
    }));
};

/**
 * Aktualisiert die Runden eines Schülers
 * @param {number} studentId Schüler-ID
 * @param {Array<string>} timestamps Array von Zeitstempeln
 * @returns {Promise<void>}
 */
export const updateRounds = async (studentId, timestamps) => {
    return await dbTransaction(async (db) => {
        // Lösche alte Runden
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM rounds WHERE student_id = ?', [studentId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Füge neue Runden hinzu
        if (timestamps.length > 0) {
            const stmt = db.prepare('INSERT INTO rounds (student_id, timestamp) VALUES (?, ?)');

            for (const timestamp of timestamps) {
                await new Promise((resolve, reject) => {
                    stmt.run(studentId, timestamp, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            stmt.finalize();
        }
    });
};

/**
 * Aktualisiert die Ersatz-IDs eines Schülers
 * @param {number} studentId Schüler-ID
 * @param {Array<number>} replacementIds Array von Ersatz-IDs
 * @returns {Promise<void>}
 */
export const updateReplacements = async (studentId, replacementIds) => {
    return await dbTransaction(async (db) => {
        // Lösche alte Replacements
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM replacements WHERE studentID = ?', [studentId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Füge neue Replacements hinzu
        if (replacementIds.length > 0) {
            const stmt = db.prepare('INSERT INTO replacements (studentID, id) VALUES (?, ?)');

            for (const replacementId of replacementIds) {
                await new Promise((resolve, reject) => {
                    stmt.run(studentId, replacementId, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            stmt.finalize();
        }
    });
};

/**
 * Löscht eine spezifische Runde anhand des Index
 * @param {number} studentId Schüler-ID
 * @param {number} roundIndex Index der zu löschenden Runde
 * @returns {Promise<void>}
 */
export const deleteRoundByIndex = async (studentId, roundIndex) => {
    const rounds = await getRoundsByStudentId(studentId);

    if (roundIndex < 0 || roundIndex >= rounds.length) {
        throw new Error('Ungültiger Runden-Index');
    }

    const timestampToDelete = rounds[roundIndex];

    return await dbRun(
        'DELETE FROM rounds WHERE student_id = ? AND timestamp = ? LIMIT 1',
        [studentId, timestampToDelete]
    );
};

/**
 * Hilfsfunktionen
 */

const getReplacementsByStudentId = async (studentId) => {
    const rows = await dbAll('SELECT id FROM replacements WHERE studentID = ?', [studentId]);
    return rows.map(row => row.id);
};

const getRoundsByStudentId = async (studentId) => {
    const rows = await dbAll('SELECT timestamp FROM rounds WHERE student_id = ? ORDER BY timestamp DESC', [studentId]);
    return rows.map(row => row.timestamp);
};

const getExpectedDonationsByStudentId = async (studentId) => {
    return await dbAll('SELECT amount FROM expected_donations WHERE student_id = ?', [studentId]);
};

const getReceivedDonationsByStudentId = async (studentId) => {
    return await dbAll('SELECT amount FROM received_donations WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
};
