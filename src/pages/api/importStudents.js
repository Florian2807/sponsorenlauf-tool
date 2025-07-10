import sqlite3 from 'sqlite3';
import { DATABASE_PATH } from '../../utils/constants';

const db = new sqlite3.Database(DATABASE_PATH);

const VALID_GENDERS = ['männlich', 'weiblich', 'divers'];

function validateStudent(student, index) {
    const errors = [];

    if (!student.vorname?.trim()) {
        errors.push(`Zeile ${index + 1}: Vorname ist erforderlich`);
    }

    if (!student.nachname?.trim()) {
        errors.push(`Zeile ${index + 1}: Nachname ist erforderlich`);
    }

    if (!student.klasse?.trim()) {
        errors.push(`Zeile ${index + 1}: Klasse ist erforderlich`);
    }

    if (student.geschlecht && !VALID_GENDERS.includes(student.geschlecht)) {
        errors.push(`Zeile ${index + 1}: Ungültiges Geschlecht "${student.geschlecht}". Erlaubte Werte: ${VALID_GENDERS.join(', ')}`);
    }

    return errors;
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { students } = req.body;

            if (!students || !Array.isArray(students) || students.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Keine Schülerdaten empfangen',
                    errors: []
                });
            }

            // Validate all students first
            const allErrors = [];
            students.forEach((student, index) => {
                const errors = validateStudent(student, index);
                allErrors.push(...errors);
            });

            if (allErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Validierung fehlgeschlagen: ${allErrors.length} Fehler gefunden`,
                    errors: allErrors
                });
            }

            // Get available classes for validation
            const availableClasses = await new Promise((resolve, reject) => {
                db.all('SELECT DISTINCT class_name FROM classes', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.class_name));
                });
            });

            // Validate classes
            const classErrors = [];
            students.forEach((student, index) => {
                if (availableClasses.length > 0 && !availableClasses.includes(student.klasse)) {
                    classErrors.push(`Zeile ${index + 1}: Ungültige Klasse "${student.klasse}". Verfügbare Klassen: ${availableClasses.join(', ')}`);
                }
            });

            if (classErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Ungültige Klassen gefunden: ${classErrors.length} Fehler`,
                    errors: classErrors
                });
            }

            // Insert students
            let insertedCount = 0;

            const insertPromises = students.map((student) => {
                return new Promise((resolve, reject) => {
                    const { vorname, nachname, geschlecht, klasse } = student;

                    db.run(
                        'INSERT INTO students (vorname, nachname, geschlecht, klasse) VALUES (?, ?, ?, ?)',
                        [vorname.trim(), nachname.trim(), geschlecht || null, klasse.trim()],
                        function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                insertedCount++;
                                resolve(this.lastID);
                            }
                        }
                    );
                });
            });

            await Promise.all(insertPromises);

            res.status(200).json({
                success: true,
                message: `${insertedCount} Schüler erfolgreich hinzugefügt`,
                count: insertedCount
            });

        } catch (error) {
            console.error('Fehler beim Erstellen der Schüler:', error);
            res.status(500).json({
                success: false,
                message: 'Interner Serverfehler beim Erstellen der Schüler',
                errors: []
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            errors: []
        });
    }
}
