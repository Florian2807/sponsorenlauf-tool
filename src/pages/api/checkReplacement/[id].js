import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');


export default async function handler(req, res) {
    let { id } = req.query;

    if (req.method === 'GET') {
        const replacements = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM replacements WHERE id = ?`, [id], (err, rows) => {
                if (err) reject(err);
                resolve(rows.map(row => row));
            });
        });
        if (replacements.length === 0) {
            res.json({ success: true, message: 'Ersatz-ID ist verfügbar' });
        } else {
            res.json({ success: false, message: 'Ersatz-ID ist bereits vergeben' });
        }
    }
}
