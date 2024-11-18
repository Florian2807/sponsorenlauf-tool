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

function updateStudentAmounts(studentId, amounts) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE students SET spenden = ? WHERE id = ?', [amounts, studentId], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { studentId, amount } = req.body;
        if (!studentId || !amount) {
            return res.status(400).json({ error: 'Schüler-ID und Betrag sind erforderlich' });
        }
        try {
            const student = await getStudentById(studentId);
            console.log(student)
            if (student) {
                // Betrag hinzufügen
                const formattedAmount = parseFloat(amount.replace(',', '.')).toFixed(2);
                console.log(formattedAmount)
                const amounts = student.spenden ? JSON.parse(student.spenden) : [];
                amounts.push(formattedAmount);
                await updateStudentAmounts(studentId, JSON.stringify(amounts));
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