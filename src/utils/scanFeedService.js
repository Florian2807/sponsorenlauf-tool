import { dbAll } from './database.js';
import { getClassStructure } from './classService.js';
import { groupClassesByGrade } from './classFilterGroups.js';
import { randomUUID } from 'node:crypto';

export const isScanDeviceId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value);

// Transient feedback is delivered to the paired display, never saved as a round.
export const publishScanError = (deviceId) => dbAll('SELECT pg_notify(?, ?)',
    ['scan_feedback', JSON.stringify({ deviceId, errorId: randomUUID() })]);

// Use committed rounds so corrections/deletions also appear, without a second event log.
export const getRecentScans = async (deviceId = null, limit = 30) => {
    const size = Math.max(1, Math.min(30, Number(limit) || 30));
    const rows = await dbAll(`WITH recent AS (
        SELECT * FROM rounds WHERE source_device_id IS NOT NULL ${deviceId ? 'AND source_device_id = ?' : ''}
        ORDER BY id DESC LIMIT ?
    ), counts AS (
        SELECT student_id, COUNT(*) AS round_count, MAX(id) AS round_version FROM rounds
        WHERE student_id IN (SELECT student_id FROM recent) GROUP BY student_id
    ) SELECT r.id, r.timestamp, r.source_device_id, r.source_station_name,
        s.id AS student_id, s.vorname, s.nachname, s.klasse,
        c.round_count, c.round_version, COALESCE(d.name, 'Scanner ' || d.id::text, 'Unbenannter Scanner') AS device_name,
        c.round_count - (SELECT COUNT(*) FROM rounds WHERE student_id = s.id AND id > r.id) AS round_number,
        (SELECT timestamp FROM rounds WHERE student_id = s.id AND id < r.id ORDER BY id DESC LIMIT 1) AS previous_timestamp
        FROM recent r JOIN students s ON s.id = r.student_id JOIN counts c ON c.student_id = s.id
        LEFT JOIN scan_devices d ON d.device_id = r.source_device_id
        ORDER BY r.id DESC`, deviceId ? [deviceId, size] : [size]);
    return rows.map(mapScan);
};

const mapScan = (row) => ({
        id: row.id, timestamp: row.timestamp, deviceId: row.source_device_id, deviceName: row.device_name,
        roundNumber: Number(row.round_number),
        stationName: row.source_station_name, previousTimestamp: row.previous_timestamp,
        student: { id: row.student_id, vorname: row.vorname, nachname: row.nachname,
            klasse: row.klasse, roundCount: Number(row.round_count), roundVersion: row.round_version },
});


// Pagination and filters run before the limit, over the complete committed scan history.
export const getScanPage = async ({ deviceId, klasse, grade, query = '', page = 1, through, cumulative = false } = {}) => {
    const conditions = ['r.source_device_id IS NOT NULL'];
    const params = [];
    if (deviceId) { conditions.push('r.source_device_id = ?'); params.push(deviceId); }
    if (klasse) { conditions.push('s.klasse = ?'); params.push(klasse); }
    if (grade) {
        const [structure, rows] = await Promise.all([
            getClassStructure(), dbAll('SELECT DISTINCT klasse FROM students WHERE klasse IS NOT NULL'),
        ]);
        const names = groupClassesByGrade(rows.map(row => row.klasse), structure).find(group => group.grade === grade)?.classes || [];
        conditions.push('s.klasse = ANY(?::text[])');
        params.push(names);
    }
    if (through !== undefined) { conditions.push('r.id <= ?'); params.push(through); }
    for (const term of query.trim().toLocaleLowerCase('de').split(/\s+/).filter(Boolean)) {
        // strpos treats user input literally, including SQL wildcard characters.
        conditions.push("strpos(lower(concat_ws(' ', s.vorname, s.nachname, s.klasse, s.id::text)), ?) > 0");
        params.push(term);
    }
    const rows = await dbAll(`WITH filtered AS (
        SELECT r.* FROM rounds r JOIN students s ON s.id = r.student_id
        WHERE ${conditions.join(' AND ')}
    ), metadata AS (
        SELECT COUNT(*) AS total, COALESCE(MAX(id), 0) AS snapshot_id,
            LEAST(?, GREATEST(1, CEIL(COUNT(*) / 30.0)))::integer AS page FROM filtered
    ), recent AS (
        SELECT * FROM filtered ORDER BY id DESC
        LIMIT ${cumulative ? '(SELECT page * 30 FROM metadata)' : '30'}
        OFFSET ${cumulative ? '0' : '(SELECT (page - 1) * 30 FROM metadata)'}
    ), counts AS (
        SELECT student_id, COUNT(*) AS round_count, MAX(id) AS round_version FROM rounds
        WHERE student_id IN (SELECT student_id FROM recent) GROUP BY student_id
    ) SELECT m.total, m.snapshot_id, m.page, r.id, r.timestamp, r.source_device_id, r.source_station_name,
        s.id AS student_id, s.vorname, s.nachname, s.klasse, c.round_count, c.round_version,
        COALESCE(d.name, 'Scanner ' || d.id::text, 'Unbenannter Scanner') AS device_name,
        c.round_count - (SELECT COUNT(*) FROM rounds WHERE student_id = s.id AND id > r.id) AS round_number,
        (SELECT timestamp FROM rounds WHERE student_id = s.id AND id < r.id ORDER BY id DESC LIMIT 1) AS previous_timestamp
        FROM metadata m LEFT JOIN recent r ON true LEFT JOIN students s ON s.id = r.student_id
        LEFT JOIN counts c ON c.student_id = s.id LEFT JOIN scan_devices d ON d.device_id = r.source_device_id
        ORDER BY r.id DESC`, [...params, page]);
    return { scans: rows.filter(row => row.id !== null).map(mapScan), total: Number(rows[0].total),
        page: Number(rows[0].page), snapshotId: through ?? Number(rows[0].snapshot_id) };
};
