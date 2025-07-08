import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./data/database.db');

const getStudentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const addRoundForStudent = (studentId, timestamp) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO rounds (timestamp, student_id) VALUES (?, ?)',
      [timestamp, studentId],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
};

const getRoundsForStudent = (studentId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT timestamp FROM rounds WHERE student_id = ? ORDER BY timestamp DESC',
      [studentId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.timestamp));
        }
      }
    );
  });
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let { id, date } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID ist erforderlich' });
    }

    if (id.startsWith('E')) {
      try {
        const row = await new Promise((resolve, reject) => {
          db.get('SELECT studentID FROM replacements WHERE id = ?', [id.replace('E', '')], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
        id = row.studentID;
      } catch (error) {
        return res.status(500).json({ error: 'Fehler beim Abrufen der Ersatz-ID' });
      }
    }

    try {
      const student = await getStudentById(id);

      if (!student) {
        return res.status(404).json({ error: 'Schüler nicht gefunden' });
      }

      const newTimestamp = new Date(date).toISOString();

      // Füge die neue Runde in die rounds Tabelle ein
      await addRoundForStudent(id, newTimestamp);

      // Lade alle Runden für diesen Studenten
      const timestamps = await getRoundsForStudent(id);

      return res.status(200).json({
        success: true,
        message: 'Runde erfolgreich gezählt!',
        timestamps,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Fehler beim Hinzufügen der Runde' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}