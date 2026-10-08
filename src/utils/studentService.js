/**
 * Service für Schüler-Operationen
 */

import { dbAll, dbRun, dbTransaction, dbImmediateTransaction } from './database.js';
import { createDatabaseBackup } from './backupService.js';
import { ensureClassExists } from './classService.js';

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
 * Hilfsfunktionen
 */

export const getRoundRecordsByStudentId = async (studentId) => (
    await dbAll(
        'SELECT id, timestamp, source_station_id AS "sourceStationId", source_station_name AS "sourceStationName" FROM rounds WHERE student_id = ? ORDER BY id DESC',
        [studentId]
    )
);
