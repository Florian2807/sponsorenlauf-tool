import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/database.db');

const getStudentById = (studentId) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM students WHERE id = ?', [studentId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

const updateExpectedDonation = (studentId, amount) => {
    return new Promise((resolve, reject) => {
        // Lösche alte erwartete Spende und füge neue hinzu
        db.serialize(() => {
            db.run('DELETE FROM expected_donations WHERE student_id = ?', [studentId], (err) => {
                if (err) reject(err);
            });

            db.run(
                'INSERT INTO expected_donations (student_id, amount) VALUES (?, ?)',
                [studentId, amount],
                function (err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    });
};

const addReceivedDonation = (studentId, amount) => {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO received_donations (student_id, amount) VALUES (?, ?)',
            [studentId, amount],
            function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { studentId, amount, isSpendenMode } = req.body;
        if (!studentId || !amount) {
            return res.status(400).json({ error: 'Schüler-ID und Betrag sind erforderlich' });
        }
        try {
            const student = await getStudentById(studentId);
            if (student) {
                const formattedAmount = parseFloat(amount.replace(',', '.').replace('€', ''));
                if (isSpendenMode) {
                    await updateExpectedDonation(studentId, formattedAmount);
                } else {
                    await addReceivedDonation(studentId, formattedAmount);
                }
                res.status(201).json({ success: true });
            } else {
                res.status(404).json({ error: 'Schüler nicht gefunden' });
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Spende:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Spende' });
        }
    } else if (req.method === 'DELETE') {
        const { donationId, type } = req.body;
        if (!donationId || !type) {
            return res.status(400).json({ error: 'Spenden-ID und Typ sind erforderlich' });
        }
        try {
            const table = type === 'expected' ? 'expected_donations' : 'received_donations';
            await new Promise((resolve, reject) => {
                db.run(`DELETE FROM ${table} WHERE id = ?`, [donationId], function (err) {
                    if (err) reject(err);
                    resolve();
                });
            });
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Fehler beim Löschen der Spende:', error);
            res.status(500).json({ error: 'Fehler beim Löschen der Spende' });
        }
    } else {
        res.setHeader('Allow', ['POST', 'DELETE']);
        res.status(405).json({ error: 'Methode nicht erlaubt' });
    }
}
