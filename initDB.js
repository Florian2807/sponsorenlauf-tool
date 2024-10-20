const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./data/students.db');

// Create a new table if it does not exist
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
