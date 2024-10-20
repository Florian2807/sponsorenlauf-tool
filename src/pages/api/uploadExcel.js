import sqlite3 from 'sqlite3';
import xlsx from 'xlsx';
import multer from 'multer';

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

      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const data = xlsx.utils.sheet_to_json(worksheet, { header: ['vorname', 'nachname', 'klasse'], defval: '', range: 1 });

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

      // paste Data in database
      db.serialize(() => {
        const insertQuery = `INSERT INTO students (id, vorname, nachname, klasse, timestamps) VALUES (?, ?, ?, ?, ?)`;

        data.forEach((row, index) => {
          const newId = parseInt(maxId + index + 1);
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
