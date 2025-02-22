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

const updateStudentTimestamps = (id, timestamps) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE students SET timestamps = ? WHERE id = ?',
      [JSON.stringify(timestamps), id],
      function (err) {
        if (err) {
          reject(err);
        } else {
          db.get('SELECT timestamps FROM students WHERE id = ?', [id], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(JSON.parse(row.timestamps));
            }
          });
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
      const timestamps = student.timestamps ? JSON.parse(student.timestamps) : [];
      timestamps.unshift(newTimestamp);

      const storedTimestamps = await updateStudentTimestamps(id, timestamps);

      if (storedTimestamps.length !== timestamps.length || storedTimestamps[0] !== timestamps[0]) {
        return res.status(500).json({ error: 'Fehler beim Aktualisieren der Timestamps' });
      }

      return res.status(200).json({
        success: true,
        message: 'Runde erfolgreich gezählt!',
        timestamps,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Fehler beim Aktualisieren der Timestamps' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}