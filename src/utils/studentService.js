/**
 * Service für Schüler-Operationen
 */

import { dbAll, dbGet, dbRun, dbTransaction, dbImmediateTransaction, createPlaceholders } from './database.js';
import { createDatabaseBackup } from './backupService.js';
import { ensureClassExists } from './classService.js';

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
        getRoundRecordsByStudentId(id),
        getExpectedDonationsByStudentId(id),
        getReceivedDonationsByStudentId(id)
    ]);

    return {
        ...student,
        replacements,
        rounds,
        timestamps: rounds.map((round) => round.timestamp),
        spenden: expectedDonations.reduce((sum, d) => sum + d.amount, 0),
        spendenKonto: receivedDonations.map(d => d.amount),
        expectedDonations: expectedDonations,
        receivedDonations: receivedDonations
    };
};

export const getPublicStudentById = async (id) => {
    const student = await dbGet(
        'SELECT id, vorname, nachname, geschlecht, klasse FROM students WHERE id = ?',
        [id]
    );
    if (!student) return null;
    const rounds = await getRoundRecordsByStudentId(id);
    return { ...student, rounds, timestamps: rounds.map((round) => round.timestamp) };
};

/**
 * Holt einen Schüler anhand seiner ID mit optimierten Basisdaten (ohne Timestamps)
 * @param {number} id Schüler-ID
 * @returns {Promise<Object|null>} Schülerdaten oder null
 */
export const getStudentByIdFast = async (id) => {
    const student = await dbGet('SELECT * FROM students WHERE id = ?', [id]);

    if (!student) return null;

    // Lade nur die kritischen Daten ohne Timestamps für bessere Performance
    const [replacements, roundCount, expectedDonations, receivedDonations] = await Promise.all([
        getReplacementsByStudentId(id),
        getRoundCountByStudentId(id), // Nur Anzahl, nicht alle Timestamps
        getExpectedDonationsByStudentId(id),
        getReceivedDonationsByStudentId(id)
    ]);

    return {
        ...student,
        replacements,
        roundCount, // Nur die Anzahl der Runden
        spenden: expectedDonations.reduce((sum, d) => sum + d.amount, 0),
        spendenKonto: receivedDonations.map(d => d.amount),
        expectedDonations: expectedDonations,
        receivedDonations: receivedDonations
    };
};

/**
 * Erstellt einen neuen Schüler
 * @param {Object} studentData Schülerdaten
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const createStudent = async (studentData) => {
    const { id, vorname, nachname, klasse, geschlecht } = studentData;

    await ensureClassExists(klasse);

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
    const updates = [];
    const params = [];

    if (studentData.klasse !== undefined) {
        await ensureClassExists(studentData.klasse);
    }

    if (studentData.vorname !== undefined) {
        updates.push('vorname = ?');
        params.push(studentData.vorname.trim());
    }

    if (studentData.nachname !== undefined) {
        updates.push('nachname = ?');
        params.push(studentData.nachname.trim());
    }

    if (studentData.klasse !== undefined) {
        updates.push('klasse = ?');
        params.push(studentData.klasse.trim());
    }

    if (studentData.geschlecht !== undefined) {
        updates.push('geschlecht = ?');
        params.push(studentData.geschlecht || null);
    }

    if (updates.length === 0) {
        return { changes: 0 };
    }

    params.push(id);

    return await dbRun(
        `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
        params
    );
};

/**
 * Löscht einen Schüler
 * @param {number} id Schüler-ID
 * @returns {Promise<Object>} Ergebnis der Operation
 */
export const deleteStudent = async (id) => {
    return await dbImmediateTransaction(async (db) => {
        const backup = await createDatabaseBackup({ reason: `before-delete-student-${id}` });

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

        return { ...result, backupFilename: backup.filename };
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
        dbAll(`SELECT id, student_id, timestamp FROM rounds WHERE student_id IN (${placeholders}) ORDER BY student_id, id DESC`, studentIds),
        dbAll(`SELECT student_id, SUM(amount) as total FROM expected_donations WHERE student_id IN (${placeholders}) GROUP BY student_id`, studentIds),
        dbAll(`SELECT student_id, amount FROM received_donations WHERE student_id IN (${placeholders}) ORDER BY student_id, created_at DESC`, studentIds)
    ]);

    // Erstelle Maps für effiziente Zuordnung
    const replacementsMap = replacements.reduce((acc, { studentID, id }) => {
        if (!acc[studentID]) acc[studentID] = [];
        acc[studentID].push(id);
        return acc;
    }, {});

    const roundsMap = rounds.reduce((acc, { id, student_id, timestamp }) => {
        if (!acc[student_id]) acc[student_id] = [];
        acc[student_id].push({ id, timestamp });
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
        rounds: roundsMap[student.id] || [],
        timestamps: (roundsMap[student.id] || []).map((round) => round.timestamp),
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
    const rounds = await getRoundRecordsByStudentId(studentId);

    if (roundIndex < 0 || roundIndex >= rounds.length) {
        throw new Error('Ungültiger Runden-Index');
    }

    return await deleteRoundById(rounds[roundIndex].id, studentId);
};

/**
 * Deletes exactly one immutable round record. The optional student ID prevents
 * a stale UI from deleting a round belonging to a different student.
 */
export const deleteRoundById = async (roundId, studentId = null) => {
    if (!Number.isInteger(Number(roundId)) || Number(roundId) <= 0) {
        throw new Error('Ungültige Runden-ID');
    }

    if (studentId === null || studentId === undefined) {
        return await dbRun('DELETE FROM rounds WHERE id = ?', [Number(roundId)]);
    }

    return await dbRun(
        'DELETE FROM rounds WHERE id = ? AND student_id = ?',
        [Number(roundId), Number(studentId)]
    );
};

/**
 * Holt einen Schüler anhand seiner ID - ULTRA SCHNELL (nur Basisdaten für Scan)
 * @param {number} id Schüler-ID
 * @returns {Promise<Object|null>} Schülerdaten oder null
 */
export const getStudentByIdMinimal = async (id) => {
    const student = await dbGet('SELECT * FROM students WHERE id = ?', [id]);

    if (!student) return null;

    // Lade nur die absolut nötigen Daten für den Scan-Prozess
    const roundCount = await getRoundCountByStudentId(id);

    return {
        ...student,
        roundCount // Nur die Anzahl der Runden - keine anderen Daten
    };
};

/**
 * Holt die höchste Schüler-ID
 * @returns {Promise<number>} Höchste ID
 */
export const getMaxStudentId = async () => {
    const result = await dbGet('SELECT MAX(id) as maxId FROM students');
    return result?.maxId || 0;
};

/**
 * Hilfsfunktionen
 */

const getReplacementsByStudentId = async (studentId) => {
    const rows = await dbAll('SELECT id FROM replacements WHERE studentID = ?', [studentId]);
    return rows.map(row => row.id);
};

export const getRoundRecordsByStudentId = async (studentId) => (
    await dbAll(
        'SELECT id, timestamp FROM rounds WHERE student_id = ? ORDER BY id DESC',
        [studentId]
    )
);

export const getRoundsByStudentId = async (studentId) => {
    const rounds = await getRoundRecordsByStudentId(studentId);
    return rounds.map((round) => round.timestamp);
};

const getRoundCountByStudentId = async (studentId) => {
    const result = await dbGet('SELECT COUNT(*) as count FROM rounds WHERE student_id = ?', [studentId]);
    return result.count;
};

const getExpectedDonationsByStudentId = async (studentId) => {
    return await dbAll('SELECT id, amount, created_at FROM expected_donations WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
};

const getReceivedDonationsByStudentId = async (studentId) => {
    return await dbAll('SELECT id, amount, created_at FROM received_donations WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
};
