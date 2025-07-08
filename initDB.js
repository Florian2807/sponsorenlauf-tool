import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/database.db');

// Create a new table if it does not exist
db.serialize(() => {
  // Create classes table first
  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade TEXT NOT NULL,
      class_name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      klasse TEXT NOT NULL,
      FOREIGN KEY (klasse) REFERENCES classes(class_name) ON DELETE RESTRICT
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
      timestamps TEXT,
      FOREIGN KEY (klasse) REFERENCES classes(class_name) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      student_id INTEGER NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expected_donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS received_donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);
});

db.close();