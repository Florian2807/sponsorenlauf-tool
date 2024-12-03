import sqlite3 from 'sqlite3';
import multer from 'multer';
import ExcelJS from 'exceljs';

const upload = multer({ storage: multer.memoryStorage() });

const uploadMiddleware = upload.single('file');

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
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          data.push({
            vorname: row.getCell(1).value,
            nachname: row.getCell(2).value,
            klasse: row.getCell(3).value,
            spenden: row.getCell(4).value,
            spendenKonto: row.getCell(5).value
          });
        }
      });

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

      db.serialize(() => {
        const insertQuery = `INSERT INTO students (id, vorname, nachname, klasse, timestamps, spenden, spendenKonto) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        data.forEach((row, index) => {
          const newId = parseInt(maxId + index + 1);
          db.run(
            insertQuery,
            [newId, row.vorname, row.nachname, row.klasse, '[]', row.spenden || null, row.spendenKonto || []],
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
