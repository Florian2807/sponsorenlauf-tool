import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

console.log('Starte Migration der Rundendaten...');

db.serialize(() => {
    // Erstelle die neue rounds Tabelle
    db.run(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      student_id INTEGER NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der rounds Tabelle:', err);
            return;
        }
        console.log('✓ rounds Tabelle erstellt');
    });

    // Lade alle Studenten mit ihren timestamps
    db.all('SELECT id, timestamps FROM students WHERE timestamps IS NOT NULL AND timestamps != "[]"', (err, students) => {
        if (err) {
            console.error('Fehler beim Laden der Studenten:', err);
            return;
        }

        console.log(`Gefundene Studenten mit Rundendaten: ${students.length}`);

        let migratedRounds = 0;
        let processedStudents = 0;

        const migrateStudent = (student) => {
            let timestamps;
            try {
                timestamps = JSON.parse(student.timestamps);
            } catch (e) {
                console.error(`Fehler beim Parsen der timestamps für Student ${student.id}:`, e);
                processedStudents++;
                if (processedStudents === students.length) {
                    console.log(`\nMigration abgeschlossen! ${migratedRounds} Runden migriert.`);
                    db.close();
                }
                return;
            }

            if (!Array.isArray(timestamps) || timestamps.length === 0) {
                processedStudents++;
                if (processedStudents === students.length) {
                    console.log(`\nMigration abgeschlossen! ${migratedRounds} Runden migriert.`);
                    db.close();
                }
                return;
            }

            // Bereite die Daten für batch insert vor
            const stmt = db.prepare('INSERT INTO rounds (timestamp, student_id) VALUES (?, ?)');

            timestamps.forEach((timestamp) => {
                stmt.run(timestamp, student.id, (err) => {
                    if (err) {
                        console.error(`Fehler beim Einfügen der Runde für Student ${student.id}:`, err);
                    } else {
                        migratedRounds++;
                    }
                });
            });

            stmt.finalize(() => {
                console.log(`✓ ${timestamps.length} Runden für Student ${student.id} migriert`);
                processedStudents++;

                if (processedStudents === students.length) {
                    console.log(`\nMigration abgeschlossen! ${migratedRounds} Runden migriert.`);
                    console.log('Die timestamps Spalte wurde NICHT gelöscht. Führen Sie das manuell durch, wenn Sie sicher sind, dass alles funktioniert.');
                    db.close();
                }
            });
        };

        if (students.length === 0) {
            console.log('Keine Studenten mit Rundendaten gefunden.');
            console.log('Migration abgeschlossen!');
            db.close();
            return;
        }

        // Migriere alle Studenten
        students.forEach(migrateStudent);
    });
});
