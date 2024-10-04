const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/students.db');

// Hilfsfunktion, um Timestamps eines Schülers zu laden
const getStudentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      }
      resolve(row);
    });
  });
};


async function updateStudentTimestamps(id, timestamps) {
  return new Promise((resolve, reject) => {
    // Update the timestamps for the student with the given id
    db.run(
      'UPDATE students SET timestamps = ? WHERE id = ?',
      [JSON.stringify(timestamps), id],
      function (err) {
        if (err) {
          return reject(err);
        }

        // After successful update, retrieve the updated timestamps to return their length
        db.get('SELECT timestamps FROM students WHERE id = ?', [id], (err, row) => {
          if (err) {
            return reject(err);
          }

          // Parse the JSON timestamps to calculate the length
          const storedTimestamps = JSON.parse(row.timestamps);
          resolve(storedTimestamps);
        });
      }
    );
  });
}


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id, date } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID ist erforderlich' });
    }

    try {
      // Lade den Schüler mit der gegebenen ID
      const student = await getStudentById(id);

      if (!student) {
        return res.status(404).json({ error: 'Schüler nicht gefunden' });
      }

      // Neue Runde hinzufügen (aktueller Zeitstempel)
      const newTimestamp = new Date(date).toISOString();
      const timestamps = student.timestamps
        ? JSON.parse(student.timestamps)
        : [];

      timestamps.unshift(newTimestamp); // Neuen Timestamp am Anfang des Arrays hinzufügen

      // Aktualisiere die Timestamps in der Datenbank
      const storedTimestamps = await updateStudentTimestamps(id, timestamps);

      // Überprüfe, ob die Anzahl der Timestamps und der erste Timestamp übereinstimmen
      if (storedTimestamps.length !== timestamps.length || storedTimestamps[0] !== timestamps[1]) {
        return res.status(500).json({ error: 'Fehler beim Aktualisieren der Timestamps' });
      }

      return res.status(200).json({
        success: true,
        message: 'Runde erfolgreich gezählt!',
        timestamps,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Fehler beim Aktualisieren der Timestamps' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
