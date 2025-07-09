import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

const saveStudent = (id, vorname, nachname, klasse, geschlecht = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO students (id, vorname, nachname, geschlecht, klasse) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, vorname, nachname, geschlecht, klasse],
      function (err) {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

const getStudentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM students WHERE id = ?`, [id], async (err, row) => {
      if (err) reject(err);
      if (row) {
        row.replacements = await getReplacementByStudentId(id);
        row.timestamps = await getRoundsForStudent(id);
        row.expectedDonations = await getExpectedDonationsForStudent(id);
        row.receivedDonations = await getReceivedDonationsForStudent(id);

        // Für Backward-Kompatibilität
        row.spenden = row.expectedDonations.reduce((sum, donation) => sum + donation.amount, 0);
        row.spendenKonto = row.receivedDonations.map(donation => donation.amount);

        resolve(row);
      } else {
        resolve(null);
      }
    });
  });
};

const getReplacementByStudentId = (studentId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id FROM replacements WHERE studentID = ?`, [studentId], (err, rows) => {
      if (err) reject(err);
      resolve(rows.map(row => row.id));
    });
  });
};

const getRoundsForStudent = (studentId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT timestamp FROM rounds WHERE student_id = ? ORDER BY timestamp DESC',
      [studentId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows.map(row => row.timestamp));
      }
    );
  });
};

const getExpectedDonationsForStudent = (studentId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, amount, created_at FROM expected_donations WHERE student_id = ? ORDER BY created_at DESC',
      [studentId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
};

const getReceivedDonationsForStudent = (studentId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, amount, created_at FROM received_donations WHERE student_id = ? ORDER BY created_at DESC',
      [studentId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
};

const updateStudent = (id, vorname, nachname, geschlecht, klasse) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE students 
       SET vorname = ?, nachname = ?, geschlecht = ?, klasse = ?
       WHERE id = ?`,
      [vorname, nachname, geschlecht, klasse, id],
      function (err) {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

const updateRoundsForStudent = (studentId, timestamps) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Lösche alle bestehenden Runden für diesen Studenten
      db.run('DELETE FROM rounds WHERE student_id = ?', [studentId], (err) => {
        if (err) reject(err);
      });

      // Füge die neuen Runden hinzu
      if (timestamps && timestamps.length > 0) {
        const stmt = db.prepare('INSERT INTO rounds (timestamp, student_id) VALUES (?, ?)');
        timestamps.forEach(timestamp => {
          stmt.run(timestamp, studentId);
        });
        stmt.finalize((err) => {
          if (err) reject(err);
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
};

const deleteRoundByIndex = (studentId, timestamps, indexToRemove) => {
  return new Promise((resolve, reject) => {
    if (indexToRemove < 0 || indexToRemove >= timestamps.length) {
      reject(new Error('Invalid index'));
      return;
    }

    const timestampToRemove = timestamps[indexToRemove];

    db.run(
      'DELETE FROM rounds WHERE student_id = ? AND timestamp = ? LIMIT 1',
      [studentId, timestampToRemove],
      function (err) {
        if (err) reject(err);
        resolve();
      }
    );
  });
};

const updateReplacement = (studentID, replacementIDs = []) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM replacements WHERE studentID = ?`, [studentID], (err) => {
        if (err) reject(err);
      });

      replacementIDs.forEach(replacement => {
        db.run(`INSERT INTO replacements (studentID, id) VALUES (?, ?)`, [studentID, replacement], (err) => {
          if (err) reject(err);
        });
      });

      resolve();
    });
  });
};

const deleteStudent = (id) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM students WHERE id = ?`, [id], (err) => {
        if (err) reject(err);
      });

      db.run(`DELETE FROM replacements WHERE studentID = ?`, [id], (err) => {
        if (err) reject(err);
      });

      // Lösche auch alle Runden für diesen Studenten
      db.run(`DELETE FROM rounds WHERE student_id = ?`, [id], (err) => {
        if (err) reject(err);
      });

      // Lösche auch alle Spenden für diesen Studenten
      db.run(`DELETE FROM expected_donations WHERE student_id = ?`, [id], (err) => {
        if (err) reject(err);
      });

      db.run(`DELETE FROM received_donations WHERE student_id = ?`, [id], (err) => {
        if (err) reject(err);
      });

      resolve();
    });
  });
};

export default async function handler(req, res) {
  let { id } = req.query;

  if (id.startsWith('E')) {
    try {
      const row = await new Promise((resolve, reject) => {
        db.get('SELECT studentID FROM replacements WHERE id = ?', [id.replace('E', '')], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      id = row.studentID;
    } catch (error) {
      return res.status(500).json({ error: 'Fehler beim Abrufen der Ersatz-ID' });
    }
  } if (req.method === 'GET') {
    try {
      const student = await getStudentById(id);
      if (student) {
        // timestamps, expectedDonations, receivedDonations und Kompatibilitätsdaten werden bereits von getStudentById geladen
        res.status(200).json(student);
      } else {
        res.status(404).json({ error: 'Schüler nicht gefunden' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
    }

  } else if (req.method === 'POST') {
    const { vorname, nachname, klasse, geschlecht, timestamps, spenden, spendenKonto, replacements } = req.body;

    if (!id || !vorname || !nachname || !klasse) {
      return res.status(400).json({ error: 'ID, Vorname, Nachname und Klasse sind erforderlich' });
    }

    // Validate geschlecht if provided
    if (geschlecht && !['männlich', 'weiblich', 'divers'].includes(geschlecht)) {
      return res.status(400).json({ error: 'Ungültiges Geschlecht. Erlaubt: männlich, weiblich, divers' });
    }

    try {
      await saveStudent(id, vorname, nachname, klasse, geschlecht || null);

      // Speichere die Runden in der separaten Tabelle
      if (timestamps && timestamps.length > 0) {
        await updateRoundsForStudent(id, timestamps);
      }

      if (replacements) {
        await updateReplacement(id, replacements);
      }

      res.status(201).json({
        id, vorname, nachname, klasse, geschlecht: geschlecht || null, timestamps: timestamps || []
      });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Speichern des Schülers' });
    }
  } else if (req.method === 'PUT') {
    const { vorname, nachname, klasse, geschlecht, timestamps, spenden, spendenKonto, replacements } = req.body;

    try {
      const student = await getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: 'Schüler nicht gefunden' });
      }

      // Validate geschlecht if provided
      if (geschlecht && !['männlich', 'weiblich', 'divers'].includes(geschlecht)) {
        return res.status(400).json({ error: 'Ungültiges Geschlecht. Erlaubt: männlich, weiblich, divers' });
      }

      await updateStudent(
        id,
        vorname !== undefined ? vorname : student.vorname,
        nachname !== undefined ? nachname : student.nachname,
        geschlecht !== undefined ? geschlecht : student.geschlecht,
        klasse !== undefined ? klasse : student.klasse
      );

      // Aktualisiere Runden wenn sie übermittelt wurden
      if (timestamps !== undefined) {
        await updateRoundsForStudent(id, timestamps);
      }

      if (replacements) await updateReplacement(id, replacements);

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Aktualisieren des Schülers' });
    }
  } else if (req.method === 'DELETE') {
    const { deleteRoundIndex } = req.body;

    try {
      const student = await getStudentById(id);
      if (!student) {
        return res.status(404).json({ error: 'Schüler nicht gefunden' });
      }

      // Wenn deleteRoundIndex angegeben ist, lösche nur diese eine Runde
      if (deleteRoundIndex !== undefined) {
        const timestamps = student.timestamps;
        if (deleteRoundIndex >= 0 && deleteRoundIndex < timestamps.length) {
          await deleteRoundByIndex(id, timestamps, deleteRoundIndex);
          res.status(200).json({ success: true, message: 'Runde gelöscht' });
        } else {
          res.status(400).json({ error: 'Ungültiger Index' });
        }
      } else {
        // Lösche den gesamten Studenten
        await deleteStudent(id);
        res.status(200).json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: 'Fehler beim Löschen' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
