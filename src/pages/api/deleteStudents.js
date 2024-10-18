const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/students.db');


export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        try {
            const deletedStudents = db.serialize(() => {
                return db.run('DELETE FROM students', [], function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Fehler beim Löschen der Daten' });
                    }
                    console.log(`Anzahl der gelöschten Zeilen: ${this.changes}`);
                    return this.changes;
                });
            });
            res.status(200).json({ message: 'Daten wurden erfolgreich gelöscht', amount: deletedStudents });
        } catch (error) {
            return res.status(500).json({ error: 'Fehler beim Löschen' });
        }
    } else {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
