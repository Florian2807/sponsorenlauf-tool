import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/students.db');

// save student to database
const saveStudent = (id, vorname, nachname, klasse, timestamps, spenden) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO students (id, vorname, nachname, klasse, timestamps, spenden) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, vorname, nachname, klasse, JSON.stringify(timestamps), JSON.stringify(spenden)],
      function (err) {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

// load student 
const getStudentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM students WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

// update student
const updateStudent = (id, vorname, nachname, klasse, timestamps, spenden) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE students 
       SET vorname = ?, nachname = ?, klasse = ?, timestamps = ?, spenden = ? 
       WHERE id = ?`,
      [vorname, nachname, klasse, JSON.stringify(timestamps), JSON.stringify(spenden), id],
      function (err) {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

// delete student
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
        student.timestamps = JSON.parse(student.timestamps);
        res.status(200).json(student);
      } else {
        res.status(404).json({ error: 'Schüler nicht gefunden' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }
  }
  else if (req.method === 'POST') {
    const { vorname, nachname, klasse, timestamps, spenden } = req.body;

    if (!id || !vorname || !nachname || !klasse || !Array.isArray(timestamps) || !Array.isArray(spenden)) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich und Timestamps müssen ein Array sein' });
    }

    try {
      await saveStudent(id, vorname, nachname, klasse, timestamps, spenden);
      res.status(201).json({ id, vorname, nachname, klasse, timestamps, spenden });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Speichern des Schülers' });
    }
  }
  else if (req.method === 'PUT') {
    const { vorname, nachname, klasse, timestamps, spenden } = req.body;

    try {
      const student = await getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: 'Schüler nicht gefunden' });
      }

      await updateStudent(id, vorname || student.vorname, nachname || student.nachname, klasse || student.klasse, timestamps || JSON.parse(student.timestamps), spenden || JSON.parse(student.spenden));
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
