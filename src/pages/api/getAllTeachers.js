import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

const loadTeachers = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM teachers', [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows)
            }
        });
    });
};

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const data = await loadTeachers();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}