import sqlite3 from 'sqlite3';
import { DATABASE_PATH } from './constants.js';

/**
 * Erstellt eine neue Datenbankverbindung
 * @returns {sqlite3.Database} Datenbankinstanz
 */
export const createDbConnection = () => {
    return new sqlite3.Database(DATABASE_PATH);
};

/**
 * Führt eine SELECT-Abfrage aus und gibt alle Ergebnisse zurück
 * @param {string} query SQL-Query
 * @param {Array} params Parameter für die Query
 * @returns {Promise<Array>} Array mit Ergebnissen
 */
export const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        const db = createDbConnection();
        db.all(query, params, (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * Führt eine SELECT-Abfrage aus und gibt das erste Ergebnis zurück
 * @param {string} query SQL-Query
 * @param {Array} params Parameter für die Query
 * @returns {Promise<Object|null>} Erstes Ergebnis oder null
 */
export const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        const db = createDbConnection();
        db.get(query, params, (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(row || null);
        });
    });
};

/**
 * Führt eine INSERT/UPDATE/DELETE-Abfrage aus
 * @param {string} query SQL-Query
 * @param {Array} params Parameter für die Query
 * @returns {Promise<{lastID: number, changes: number}>} Ergebnis der Operation
 */
export const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        const db = createDbConnection();
        db.run(query, params, function (err) {
            db.close();
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

/**
 * Führt mehrere Operationen in einer Transaktion aus
 * @param {Function} operations Funktion mit den Datenbankoperationen
 * @returns {Promise} Ergebnis der Transaktion
 */
export const dbTransaction = (operations) => {
    return new Promise((resolve, reject) => {
        const db = createDbConnection();

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            Promise.resolve(operations(db))
                .then(result => {
                    db.run('COMMIT', (err) => {
                        db.close();
                        if (err) reject(err);
                        else resolve(result);
                    });
                })
                .catch(error => {
                    db.run('ROLLBACK', () => {
                        db.close();
                        reject(error);
                    });
                });
        });
    });
};

/**
 * Bereitet eine SQL-Query mit Platzhaltern vor
 * @param {Array} items Array von Elementen
 * @returns {string} Platzhalter für SQL IN-Klausel
 */
export const createPlaceholders = (items) => {
    return items.map(() => '?').join(',');
};
