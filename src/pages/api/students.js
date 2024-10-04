const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/students.db');

// Hilfsfunktion zum Laden der Daten aus der Datenbank und Parsen des timestamps-Strings
const loadStudents = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) {
        reject(err);
      }

      // Parse den 'timestamps'-String in ein Array, falls vorhanden
      const parsedRows = rows.map(student => {
        return {
          ...student,
          timestamps: student.timestamps ? JSON.parse(student.timestamps) : [] // Parsen oder leeres Array zurückgeben
        };
      });

      resolve(parsedRows);
    });
  });
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await loadStudents();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
