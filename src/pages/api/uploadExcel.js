import sqlite3 from 'sqlite3';
import multer from 'multer';
import ExcelJS from 'exceljs';

const upload = multer({ storage: multer.memoryStorage() });

const uploadMiddleware = upload.single('file');

const getMaxId = (db) => {
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

const insertStudent = (db, student, newId) => {
  return new Promise((resolve, reject) => {
    const insertQuery = `INSERT INTO students (id, vorname, nachname, geschlecht, klasse) VALUES (?, ?, ?, ?, ?)`;
    db.run(
      insertQuery,
      [newId, student.vorname, student.nachname, student.geschlecht, student.klasse],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file' });
    }

    try {
      const buffer = req.file.buffer;

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      const data = [];
      const errors = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Expected Excel column order: Vorname, Nachname, Geschlecht, Klasse
          const vorname = row.getCell(1).value?.toString()?.trim();
          const nachname = row.getCell(2).value?.toString()?.trim();
          const geschlecht = row.getCell(3).value?.toString()?.trim();
          const klasse = row.getCell(4).value?.toString()?.trim();

          // Validate all required fields are present
          const rowErrors = [];
          if (!vorname) rowErrors.push('Vorname fehlt');
          if (!nachname) rowErrors.push('Nachname fehlt');
          if (!geschlecht) rowErrors.push('Geschlecht fehlt');
          if (!klasse) rowErrors.push('Klasse fehlt');

          // Validate geschlecht value
          if (geschlecht && !['männlich', 'weiblich', 'divers'].includes(geschlecht.toLowerCase())) {
            rowErrors.push(`Ungültiges Geschlecht: "${geschlecht}". Erlaubt: männlich, weiblich, divers`);
          }

          if (rowErrors.length > 0) {
            errors.push(`Zeile ${rowNumber}: ${rowErrors.join(', ')}`);
          } else {
            data.push({
              vorname,
              nachname,
              geschlecht: geschlecht.toLowerCase(),
              klasse
            });
          }
        }
      });

      // If there are validation errors, return them
      if (errors.length > 0) {
        return res.status(400).json({
          message: 'Validierungsfehler in Excel-Datei',
          errors: errors
        });
      }

      // If no data rows found
      if (data.length === 0) {
        return res.status(400).json({
          message: 'Keine gültigen Datenzeilen in Excel-Datei gefunden'
        });
      }

      const db = new sqlite3.Database('./data/database.db');

      const maxId = await getMaxId(db);
      let insertedCount = 0;

      for (let i = 0; i < data.length; i++) {
        const newId = maxId + i + 1;
        await insertStudent(db, data[i], newId);
        insertedCount++;
      }

      db.close((err) => {
        if (err) {
          console.error('Fehler beim Schließen der Datenbank:', err.message);
          return res.status(500).json({ message: 'Error closing database' });
        } else {
          console.log('Datenbankverbindung geschlossen.');
          res.status(200).json({ message: 'Data successfully inserted', count: insertedCount });
        }
      });
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Datei:', error);
      res.status(500).json({ message: 'Error processing file' });
    }
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};