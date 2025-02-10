import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

const loadStudents = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const parsedRows = rows.map(student => ({
          ...student,
          timestamps: student.timestamps ? JSON.parse(student.timestamps) : [],
          spendenKonto: student.spendenKonto ? JSON.parse(student.spendenKonto) : [],
        }));

        const studentIds = parsedRows.map(student => student.id);

        db.all(`SELECT studentID, id FROM replacements WHERE studentID IN (${studentIds.map(() => '?').join(',')})`, studentIds, (err, replacements) => {
          if (err) {
            reject(err);
          } else {
            const replacementsMap = replacements.reduce((acc, { studentID, id }) => {
              if (!acc[studentID]) {
                acc[studentID] = [];
              }
              acc[studentID].push(id);
              return acc;
            }, {});

            const studentsWithReplacements = parsedRows.map(student => ({
              ...student,
              replacements: replacementsMap[student.id] || [],
            }));

            resolve(studentsWithReplacements);
          }
        });
      }
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