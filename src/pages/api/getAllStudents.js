import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

const loadStudents = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const studentIds = rows.map(student => student.id);

        if (studentIds.length === 0) {
          resolve(rows);
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

                // Lade erwartete Spenden
                db.all(`SELECT student_id, SUM(amount) as total_expected FROM expected_donations WHERE student_id IN (${studentIds.map(() => '?').join(',')}) GROUP BY student_id`, studentIds, (err, expectedDonations) => {
                  if (err) {
                    reject(err);
                  } else {
                    const expectedMap = expectedDonations.reduce((acc, { student_id, total_expected }) => {
                      acc[student_id] = total_expected;
                      return acc;
                    }, {});

                    // Lade erhaltene Spenden
                    db.all(`SELECT student_id, amount FROM received_donations WHERE student_id IN (${studentIds.map(() => '?').join(',')}) ORDER BY student_id, created_at DESC`, studentIds, (err, receivedDonations) => {
                      if (err) {
                        reject(err);
                      } else {
                        const receivedMap = receivedDonations.reduce((acc, { student_id, amount }) => {
                          if (!acc[student_id]) {
                            acc[student_id] = [];
                          }
                          acc[student_id].push(amount);
                          return acc;
                        }, {});

                        const studentsWithData = rows.map(student => ({
                          ...student,
                          replacements: replacementsMap[student.id] || [],
                          timestamps: roundsMap[student.id] || [],
                          spenden: expectedMap[student.id] || 0,
                          spendenKonto: receivedMap[student.id] || [],
                        }));

                        resolve(studentsWithData);
                      }
                    });
                  }
                });
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