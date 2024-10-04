import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

// Hilfsfunktion zum Speichern von Daten
const saveStudent = (id, vorname, nachname, klasse, timestamps) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO students (id, vorname, nachname, klasse, timestamps) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, vorname, nachname, klasse, JSON.stringify(timestamps)],
      function (err) {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

// Hilfsfunktion zum Laden eines Schülers
const getStudentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM students WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

// Hilfsfunktion zum Aktualisieren eines Schülers
const updateStudent = (id, vorname, nachname, klasse, timestamps) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE students 
       SET vorname = ?, nachname = ?, klasse = ?, timestamps = ? 
       WHERE id = ?`,
      [vorname, nachname, klasse, JSON.stringify(timestamps), id],
      function (err) {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

// Hilfsfunktion zum Löschen eines Schülers
const deleteStudent = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM students WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      resolve();
    });
  });
};

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    try {
      const student = await getStudentById(id);
      if (student) {
        student.timestamps = JSON.parse(student.timestamps); // Parsen des JSON-Timestamps
        res.status(200).json(student);
      } else {
        res.status(404).json({ error: 'Schüler nicht gefunden' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
  } 
  else if (req.method === 'POST') {
    const { vorname, nachname, klasse, timestamps } = req.body;

    if (!id || !vorname || !nachname || !klasse || !Array.isArray(timestamps)) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich und Timestamps müssen ein Array sein' });
    }

    try {
      await saveStudent(id, vorname, nachname, klasse, timestamps);
      res.status(201).json({ id, vorname, nachname, klasse, timestamps });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Speichern des Schülers' });
    }
  } 
  else if (req.method === 'PUT') {
    const { vorname, nachname, klasse, timestamps } = req.body;

    try {
      const student = await getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: 'Schüler nicht gefunden' });
      }

      await updateStudent(id, vorname || student.vorname, nachname || student.nachname, klasse || student.klasse, timestamps || JSON.parse(student.timestamps));
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Schülers' });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      const student = await getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: 'Schüler nicht gefunden' });
      }

      await deleteStudent(id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Löschen des Schülers' });
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
