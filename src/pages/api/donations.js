// src/pages/api/donations.js
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/students.db');

function getStudentById(studentId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM students WHERE id = ?', [studentId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { studentId, amount, isSpendenMode } = req.body;
        if (!studentId || !amount) {
            return res.status(400).json({ error: 'Schüler-ID und Betrag sind erforderlich' });
        }
        try {
            const student = await getStudentById(studentId);
            if (student) {
                const formattedAmount = parseFloat(amount.replaceAll(',', '.').replaceAll('€', '')).toFixed(2);
                if (isSpendenMode) {
                    await updateStudentAmounts(student, formattedAmount);
                } else {
                    await updateStudentKontoAmounts(student, formattedAmount);
                }
            } else {
                return res.status(404).json({ error: 'Schüler nicht gefunden' });
            }
            res.status(201).json({ success: true });
        } catch (error) {
            console.error('Fehler beim Speichern der Spende:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Spende' });
        }
    } else {
        res.status(405).json({ error: 'Methode nicht erlaubt' });
    }
}

function updateStudentAmounts(student, amount) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE students SET spenden = ? WHERE id = ?', [amount, student.id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function updateStudentKontoAmounts(student, amount) {
    const amounts = student.spendenKonto ? JSON.parse(student.spendenKonto) : [];
    amounts.push(Number(amount));
    return new Promise((resolve, reject) => {
        db.run('UPDATE students SET spendenKonto = ? WHERE id = ?', [JSON.stringify(amounts), student.id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}