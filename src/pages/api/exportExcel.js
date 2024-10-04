import JSZip from 'jszip';
import { Workbook } from 'exceljs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Funktion, um Daten aus der SQLite-Datenbank zu laden
async function getClassData() {
  const db = await open({
    filename: './data/students.db', // Pfad zur SQLite-Datenbank
    driver: sqlite3.Database,
  });

  // Abfrage, um die Schülerdaten inklusive Timestamps zu erhalten
  const classData = await db.all(`
    SELECT klasse, vorname, nachname, timestamps
    FROM students
    ORDER BY klasse, nachname
  `);

  // Strukturieren der Daten nach Klassen und Konvertierung der Timestamps
  const groupedByClass = classData.reduce((acc, row) => {
    // Falls Timestamps vorhanden sind, in ein Array parsen (z.B. wenn sie als JSON-String gespeichert sind)
    const timestampsArray = row.timestamps ? JSON.parse(row.timestamps) : [];

    if (!acc[row.klasse]) {
      acc[row.klasse] = [];
    }
    acc[row.klasse].push({
      vorname: row.vorname,
      nachname: row.nachname,
      rounds: timestampsArray.length, // Die Anzahl der Timestamps entspricht den Runden
    });

    return acc;
  }, {});

  await db.close();
  return groupedByClass;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const zip = new JSZip();

      // Hole die Klassendaten aus der Datenbank
      const classData = await getClassData();

      // Erstelle Excel-Dateien für jede Klasse
      for (const [klasse, students] of Object.entries(classData)) {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Schüler');

        worksheet.columns = [
          { header: 'Vorname', key: 'vorname', width: 20 },
          { header: 'Nachname', key: 'nachname', width: 20 },
          { header: 'Runden', key: 'rounds', width: 10 },
        ];

        students.forEach((student) => {
          worksheet.addRow({
            vorname: student.vorname,
            nachname: student.nachname,
            rounds: student.rounds,
          });
        });

        // Excel-Datei zu ZIP-Archiv hinzufügen
        const buffer = await workbook.xlsx.writeBuffer();
        zip.file(`${klasse}.xlsx`, buffer);
      }

      // ZIP-Datei erzeugen
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      // Header setzen und ZIP-Datei zurückschicken
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=class_statistics.zip`);
      res.send(zipBuffer);
    } catch (error) {
      console.error('Error generating Excel files:', error);
      res.status(500).json({ message: 'Fehler beim Erstellen der Excel-Dateien.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
