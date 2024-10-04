const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./data/students.db');

// Erstelle die Tabelle, falls sie noch nicht existiert
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      klasse TEXT NOT NULL,
      timestamps TEXT
    )
  `);
});

db.close();
