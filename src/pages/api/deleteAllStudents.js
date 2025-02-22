import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/database.db');

const deleteAllStudents = () => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM students', function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
};

export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        try {
            const deletedStudents = await deleteAllStudents();
            res.status(200).json({ message: 'Daten wurden erfolgreich gelöscht', amount: deletedStudents });
        } catch (error) {
            res.status(500).json({ error: 'Fehler beim Löschen der Daten' });
        }
    } else {
        res.setHeader('Allow', ['DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}