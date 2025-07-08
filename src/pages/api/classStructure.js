import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'database.db');

export default function handler(req, res) {
    const db = new sqlite3.Database(dbPath);

    if (req.method === 'GET') {
        db.all("SELECT grade, class_name FROM classes ORDER BY id, class_name", (err, rows) => {
            if (err) {
                console.error('Fehler beim Lesen der Klassenstruktur:', err);
                res.status(500).json({ message: 'Fehler beim Lesen der Klassenstruktur.' });
                db.close();
                return;
            }

            // Gruppiere die Klassen nach Jahrgängen (ohne zusätzliche Sortierung)
            const structure = {};
            rows.forEach(row => {
                if (!structure[row.grade]) {
                    structure[row.grade] = [];
                }
                structure[row.grade].push(row.class_name);
            });

            res.status(200).json(structure);
            db.close();
        });
    } else if (req.method === 'PUT') {
        const { availableClasses } = req.body;

        // Validierung der Eingaben
        if (!availableClasses || typeof availableClasses !== 'object') {
            res.status(400).json({ message: 'Ungültige Klassenstruktur.' });
            db.close();
            return;
        }

        // Lösche alle bestehenden Einträge
        db.run("DELETE FROM classes", (err) => {
            if (err) {
                console.error('Fehler beim Löschen der alten Klassenstruktur:', err);
                res.status(500).json({ message: 'Fehler beim Speichern der Klassenstruktur.' });
                db.close();
                return;
            }

            // Füge neue Einträge hinzu
            const stmt = db.prepare("INSERT INTO classes (grade, class_name) VALUES (?, ?)");
            let hasError = false;

            Object.entries(availableClasses).forEach(([grade, classes]) => {
                classes.forEach(className => {
                    stmt.run(grade, className, (err) => {
                        if (err && !hasError) {
                            hasError = true;
                            console.error('Fehler beim Einfügen der Klassenstruktur:', err);
                            res.status(500).json({ message: 'Fehler beim Speichern der Klassenstruktur.' });
                            stmt.finalize();
                            db.close();
                        }
                    });
                });
            });

            stmt.finalize((err) => {
                if (err || hasError) {
                    if (!hasError) {
                        console.error('Fehler beim Finalisieren der Klassenstruktur:', err);
                        res.status(500).json({ message: 'Fehler beim Speichern der Klassenstruktur.' });
                    }
                    db.close();
                    return;
                }

                res.status(200).json({
                    success: true,
                    message: 'Klassenstruktur erfolgreich aktualisiert.',
                    availableClasses: availableClasses
                });
                db.close();
            });
        });
    } else {
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
        db.close();
    }
}
