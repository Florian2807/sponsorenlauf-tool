import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const result = Object.entries(req.body)
            .flatMap(([klasse, ids]) => ids.map(obj => ({ id: obj.id, klasse })));

        try {
            await new Promise((resolve, reject) => {
                db.serialize(() => {
                    const stmt = db.prepare(`UPDATE teachers SET klasse = ? WHERE id = ?`);
                    result.forEach(({ id, klasse }) => {
                        stmt.run(klasse, id, function (err) {
                            if (err) reject(err);
                        });
                    });
                    stmt.finalize((err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });

            // Setze die Klasse auf null für Lehrer, die nicht im Request erwähnt werden
            const mentionedIds = result.map(({ id }) => id);
            await new Promise((resolve, reject) => {
                db.run(`UPDATE teachers SET klasse = NULL WHERE id NOT IN (${mentionedIds.map(() => '?').join(',')})`, mentionedIds, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            const teachers = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM teachers`, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            res.status(200).json({ success: true, teachers });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}