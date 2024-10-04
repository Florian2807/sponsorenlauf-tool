// pages/api/uploadExcel.js

import sqlite3 from 'sqlite3';
import xlsx from 'xlsx';
import multer from 'multer';

// Konfiguriere multer für das Speichern von Dateien im Speicher
const upload = multer({ storage: multer.memoryStorage() });

// Middleware für die Verarbeitung von Datei-Uploads
const uploadMiddleware = upload.single('file');

// API-Handler
export default async function handler(req, res) {
  // Überprüfen, ob die Methode POST ist
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verwende die Middleware manuell
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file' });
    }

    try {
      const buffer = req.file.buffer;

      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const data = xlsx.utils.sheet_to_json(worksheet, { header: ['vorname', 'nachname', 'klasse'], defval: '', range: 1 });
      // Verbindung zur SQLite-Datenbank herstellen
      const db = new sqlite3.Database('./data/students.db', (err) => {
        if (err) {
          console.error('Fehler beim Öffnen der Datenbank:', err.message);
          res.status(500).json({ message: 'Database connection error' });
          return;
        }
      });

      const getMaxIdPromise = () => {
        return new Promise((resolve, reject) => {
          db.get(`SELECT MAX(id) as maxId FROM students`, [], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row.maxId || 0);
            }
          });
        });
      };

      const maxId = await getMaxIdPromise();
      let insertedCount = 0;

      // Daten in die Datenbank einfügen
      db.serialize(() => {
        const insertQuery = `INSERT INTO students (id, vorname, nachname, klasse, timestamps) VALUES (?, ?, ?, ?, ?)`;

        data.forEach((row, index) => {
          const newId = parseInt(maxId + index + 1);
          console.log(typeof newId, typeof row.vorname, typeof row.nachname, typeof row.klasse);
          db.run(
            insertQuery,
            [newId, row.vorname, row.nachname, row.klasse, '[]'],
            (err) => {
              if (err) {
                console.error('Fehler beim Einfügen:', err.message);
              } else {
                console.log(`Datensatz ${newId} erfolgreich eingefügt.`);
                insertedCount++;
              }
            }
          );
        });
      });


      // Verbindung schließen und Erfolgsmeldung senden
      db.close((err) => {
        if (err) {
          console.error('Fehler beim Schließen der Datenbank:', err.message);
          return res.status(500).json({ message: 'Error closing database' });
        } else {
          console.log('Datenbankverbindung geschlossen.');
          res.status(200).json({ message: 'Data successfully inserted', count: insertedCount});
        }
      });
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Datei:', error);
      res.status(500).json({ message: 'Error processing file' });
    }
  });
}

// Config für das Request-Body Parsing auf Buffer stellen
export const config = {
  api: {
    bodyParser: false, // Deaktiviere den Next.js Body-Parser, da wir multer verwenden
  },
};
