import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'database.db');

export default function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        return;
    }

    const db = new sqlite3.Database(dbPath);

    // Hole alle Klassen für das Dropdown
    db.all("SELECT DISTINCT class_name FROM classes ORDER BY id", (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Klassen:', err);
            res.status(500).json({ message: 'Fehler beim Abrufen der Klassen.' });
            db.close();
            return;
        }

        const classes = rows.map(row => row.class_name);
        res.status(200).json(classes);
        db.close();
    });
}
