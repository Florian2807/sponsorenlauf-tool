import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

const loadStudents = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const parsedRows = rows.map(student => ({
          ...student,
          spendenKonto: student.spendenKonto ? JSON.parse(student.spendenKonto) : [],
        }));
        const studentIds = parsedRows.map(student => student.id);

        if (studentIds.length === 0) {
          resolve(parsedRows);
          return;
        }

        // Lade Replacements
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

            // Lade Runden aus der separaten Tabelle
            db.all(`SELECT student_id, timestamp FROM rounds WHERE student_id IN (${studentIds.map(() => '?').join(',')}) ORDER BY student_id, timestamp DESC`, studentIds, (err, rounds) => {
              if (err) {
                reject(err);
              } else {
                const roundsMap = rounds.reduce((acc, { student_id, timestamp }) => {
                  if (!acc[student_id]) {
                    acc[student_id] = [];
                  }
                  acc[student_id].push(timestamp);
                  return acc;
                }, {});

                const studentsWithData = parsedRows.map(student => ({
                  ...student,
                  replacements: replacementsMap[student.id] || [],
                  timestamps: roundsMap[student.id] || [],
                }));

                resolve(studentsWithData);
              }
            });
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