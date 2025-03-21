import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

// Create a new table if it does not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      klasse TEXT NOT NULL,
      timestamps TEXT,
      spenden REAL,
      spendenKonto TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS replacements (
      id INTEGER PRIMARY KEY,
      studentID INTEGER REFERENCES students(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      klasse TEXT,
      email TEXT,
      timestamps TEXT
    )
  `)
});

db.close();