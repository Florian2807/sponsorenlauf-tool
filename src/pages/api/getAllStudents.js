const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/students.db');

const loadStudents = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) {
        reject(err);
      }

      const parsedRows = Promise.all(rows.map(async student => {
        const replacements = await new Promise((resolve, reject) => {
          db.all('SELECT id FROM replacements WHERE studentID = ?', [student.id], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows.map(row => row.id));
            }
          });
        });

        return {
          ...student,
          timestamps: student.timestamps ? JSON.parse(student.timestamps) : [],
          spendenKonto: student.spendenKonto ? JSON.parse(student.spendenKonto) : [],
          replacements: replacements
        };
      }));

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
