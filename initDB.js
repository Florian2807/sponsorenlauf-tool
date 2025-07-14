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
      geschlecht TEXT CHECK (geschlecht IN ('männlich', 'weiblich', 'divers') OR geschlecht IS NULL),
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

  // Erstelle Indizes für bessere Performance
  console.log('Creating database indexes for better performance...');

  // Index für rounds.student_id (häufigste Abfrage beim Scannen)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_rounds_student_id 
    ON rounds(student_id)
  `);

  // Index für rounds.timestamp (für zeitbasierte Sortierung)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_rounds_timestamp 
    ON rounds(timestamp)
  `);

  // Kombinierter Index für student_id + timestamp (für häufige Abfragen)
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_rounds_student_timestamp 
    ON rounds(student_id, timestamp DESC)
  `);

  // Index für expected_donations.student_id
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_expected_donations_student_id 
    ON expected_donations(student_id)
  `);

  // Index für received_donations.student_id
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_received_donations_student_id 
    ON received_donations(student_id)
  `);

  // Index für replacements.studentID
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_replacements_student_id 
    ON replacements(studentID)
  `);

  console.log('Database tables and indexes created successfully!');
});

db.close();