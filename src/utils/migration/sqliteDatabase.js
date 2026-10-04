import sqlite3 from 'sqlite3';

const open = () => {
    if (!process.env.SPONSORENLAUF_SQLITE_IMPORT_PATH) throw new Error('SQLite is only supported for migration snapshots');
    const db = new sqlite3.Database(process.env.SPONSORENLAUF_SQLITE_IMPORT_PATH);
    db.configure('busyTimeout', 5000);
    db.run('PRAGMA foreign_keys = ON');
    return db;
};
export const dbGet = (sql) => new Promise((resolve, reject) => {
    const db = open();
    db.get(sql, (error, row) => db.close(() => error ? reject(error) : resolve(row)));
});
export const dbImmediateTransaction = (operations) => new Promise((resolve, reject) => {
    const db = open();
    db.run('BEGIN IMMEDIATE', async error => {
        if (error) { db.close(); reject(error); return; }
        try {
            const result = await operations(db);
            db.run('COMMIT', error => db.close(() => error ? reject(error) : resolve(result)));
        } catch (error) {
            db.run('ROLLBACK', () => db.close(() => reject(error)));
        }
    });
});
