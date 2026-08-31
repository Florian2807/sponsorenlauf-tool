import { dbImmediateTransaction } from './database.js';

const dbGet = (db, query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
        if (error) reject(error);
        else resolve(row || null);
    });
});

const dbAll = (db, query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
        if (error) reject(error);
        else resolve(rows || []);
    });
});

const dbRun = (db, query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function onRun(error) {
        if (error) reject(error);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
});

const ensureRoundSchema = async (db) => {
    const columns = await dbAll(db, 'PRAGMA table_info(rounds)');
    const columnNames = new Set(columns.map((column) => column.name));

    if (!columnNames.has('scan_id')) {
        await dbRun(db, 'ALTER TABLE rounds ADD COLUMN scan_id TEXT');
    }

    if (!columnNames.has('source_device_id')) {
        await dbRun(db, 'ALTER TABLE rounds ADD COLUMN source_device_id TEXT');
    }

    if (!columnNames.has('recorded_at')) {
        await dbRun(db, 'ALTER TABLE rounds ADD COLUMN recorded_at TEXT');
    }

    await dbRun(
        db,
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_rounds_scan_id ON rounds(scan_id) WHERE scan_id IS NOT NULL'
    );
};

const normalizePrevention = (prevention = {}) => ({
    enabled: prevention.enabled ?? true,
    timeThresholdMinutes: Number.isFinite(prevention.timeThresholdMinutes)
        ? prevention.timeThresholdMinutes
        : 5,
    mode: prevention.mode === 'block' ? 'block' : 'confirm',
});

export class RoundServiceError extends Error {
    constructor(message, { code, status = 500, details = {} } = {}) {
        super(message);
        this.name = 'RoundServiceError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

/**
 * Atomically checks the latest accepted scan and appends a new round.
 * BEGIN IMMEDIATE serializes competing scanner requests before the check.
 */
export const recordRound = async ({
    studentId,
    confirmDoubleScan = false,
    doubleScanPrevention,
    scanId = null,
    sourceDeviceId = null,
    now = new Date(),
}) => dbImmediateTransaction(async (db) => {
    await ensureRoundSchema(db);

    const timestamp = now.toISOString();
    const nowMs = now.getTime();

    if (scanId) {
        const existingScan = await dbGet(db, `
            SELECT
                r.id AS roundId,
                r.timestamp AS roundTimestamp,
                s.id AS studentId,
                s.vorname,
                s.nachname,
                s.geschlecht,
                s.klasse,
                (
                SELECT COUNT(*) FROM rounds WHERE student_id = r.student_id
            ) AS roundCount
            FROM rounds r
            JOIN students s ON s.id = r.student_id
            WHERE r.scan_id = ?
        `, [scanId]);

        if (existingScan) {
            if (Number(existingScan.studentId) !== Number(studentId)) {
                throw new RoundServiceError('Scan-ID wurde bereits für einen anderen Schüler verwendet', {
                    code: 'SCAN_ID_CONFLICT',
                    status: 409,
                });
            }

            const {
                roundId,
                roundTimestamp: existingTimestamp,
                studentId: existingStudentId,
                ...studentData
            } = existingScan;
            return {
                accepted: true,
                idempotentReplay: true,
                round: { id: roundId, timestamp: existingTimestamp },
                student: { id: existingStudentId, ...studentData },
                wasDoubleScan: false,
            };
        }
    }

    const student = await dbGet(db, `
        SELECT s.*, COUNT(r.id) AS roundCount
        FROM students s
        LEFT JOIN rounds r ON r.student_id = s.id
        WHERE s.id = ?
        GROUP BY s.id
    `, [studentId]);

    if (!student) {
        throw new RoundServiceError('Schüler nicht gefunden', {
            code: 'STUDENT_NOT_FOUND',
            status: 404,
        });
    }

    // ID order represents acceptance order and is robust against legacy client
    // clocks that may have stored timestamps in the past or future.
    const lastRound = await dbGet(db, `
        SELECT id, timestamp
        FROM rounds
        WHERE student_id = ?
        ORDER BY id DESC
        LIMIT 1
    `, [studentId]);

    const prevention = normalizePrevention(doubleScanPrevention);
    const lastRoundMs = lastRound ? new Date(lastRound.timestamp).getTime() : Number.NaN;
    const timeDifferenceMs = nowMs - lastRoundMs;
    const thresholdMs = prevention.timeThresholdMinutes * 60 * 1000;
    const isDoubleScan = Boolean(
        lastRound
        && Number.isFinite(lastRoundMs)
        && timeDifferenceMs >= 0
        && timeDifferenceMs < thresholdMs
    );

    if (isDoubleScan && prevention.enabled && !confirmDoubleScan) {
        return {
            accepted: false,
            requiresConfirmation: prevention.mode === 'confirm',
            blocked: prevention.mode === 'block',
            student,
            lastRoundTime: lastRound.timestamp,
            timeDifferenceMs,
            thresholdMinutes: prevention.timeThresholdMinutes,
        };
    }

    const insert = await dbRun(db, `
        INSERT INTO rounds (timestamp, student_id, scan_id, source_device_id, recorded_at)
        VALUES (?, ?, ?, ?, ?)
    `, [timestamp, studentId, scanId, sourceDeviceId, timestamp]);

    return {
        accepted: true,
        idempotentReplay: false,
        round: { id: insert.lastID, timestamp },
        student: {
            ...student,
            roundCount: Number(student.roundCount) + 1,
        },
        wasDoubleScan: isDoubleScan,
    };
});
