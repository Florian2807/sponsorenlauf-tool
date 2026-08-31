import { dbImmediateTransaction } from './database.js';

const dbRun = (db, query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function onRun(error) {
        if (error) reject(error);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
});

const dbAll = (db, query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
        if (error) reject(error);
        else resolve(rows || []);
    });
});

const dbExec = (db, query) => new Promise((resolve, reject) => {
    db.exec(query, (error) => {
        if (error) reject(error);
        else resolve();
    });
});

const addColumnIfMissing = async (db, table, column, definition) => {
    const columns = await dbAll(db, `PRAGMA table_info(${table})`);
    if (!columns.some((existingColumn) => existingColumn.name === column)) {
        await dbRun(db, `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
};

const migrations = [
    {
        version: 1,
        name: 'create-base-schema',
        up: async (db) => dbExec(db, `
            CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                grade TEXT NOT NULL,
                class_name TEXT NOT NULL UNIQUE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY,
                vorname TEXT NOT NULL,
                nachname TEXT NOT NULL,
                geschlecht TEXT CHECK (geschlecht IN ('männlich', 'weiblich', 'divers') OR geschlecht IS NULL),
                klasse TEXT NOT NULL,
                FOREIGN KEY (klasse) REFERENCES classes(class_name) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS replacements (
                id INTEGER PRIMARY KEY,
                studentID INTEGER REFERENCES students(id)
            );

            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY,
                vorname TEXT NOT NULL,
                nachname TEXT NOT NULL,
                klasse TEXT,
                email TEXT,
                FOREIGN KEY (klasse) REFERENCES classes(class_name) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                student_id INTEGER NOT NULL,
                scan_id TEXT,
                source_device_id TEXT,
                recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS expected_donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS received_donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `),
    },
    {
        version: 2,
        name: 'add-round-scan-metadata',
        up: async (db) => {
            await addColumnIfMissing(db, 'rounds', 'scan_id', 'TEXT');
            await addColumnIfMissing(db, 'rounds', 'source_device_id', 'TEXT');
            await addColumnIfMissing(db, 'rounds', 'recorded_at', 'TEXT');
            await dbRun(db, 'UPDATE rounds SET recorded_at = timestamp WHERE recorded_at IS NULL');
        },
    },
    {
        version: 3,
        name: 'create-database-indexes',
        up: async (db) => dbExec(db, `
            CREATE INDEX IF NOT EXISTS idx_rounds_student_id ON rounds(student_id);
            CREATE INDEX IF NOT EXISTS idx_rounds_timestamp ON rounds(timestamp);
            CREATE INDEX IF NOT EXISTS idx_rounds_student_timestamp ON rounds(student_id, timestamp DESC);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_rounds_scan_id ON rounds(scan_id) WHERE scan_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_expected_donations_student_id ON expected_donations(student_id);
            CREATE INDEX IF NOT EXISTS idx_received_donations_student_id ON received_donations(student_id);
            CREATE INDEX IF NOT EXISTS idx_replacements_student_id ON replacements(studentID);
        `),
    },
];

export const getLatestSchemaVersion = () => migrations.at(-1)?.version || 0;

export const runDatabaseMigrations = async () => dbImmediateTransaction(async (db) => {
    await dbExec(db, `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const appliedRows = await dbAll(db, 'SELECT version FROM schema_migrations ORDER BY version');
    const appliedVersions = new Set(appliedRows.map((row) => row.version));
    const applied = [];

    for (const migration of migrations) {
        if (appliedVersions.has(migration.version)) continue;

        await migration.up(db);
        await dbRun(
            db,
            'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
            [migration.version, migration.name]
        );
        applied.push(migration.version);
    }

    const currentVersion = getLatestSchemaVersion();
    await dbRun(db, `PRAGMA user_version = ${currentVersion}`);

    return { applied, currentVersion };
});
