import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

export default function handler(req, res) {
    if (req.method === 'GET') {
        db.all('SELECT DISTINCT klasse FROM students', [], (err, rows) => {
            if (err) {
                console.error('Fehler beim Abrufen der Klassen:', err);
                return res.status(500).json({ message: 'Fehler beim Abrufen der Klassen.' });
            }

            const classes = rows.map(row => row.klasse);
            res.status(200).json(classes);
        });
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}