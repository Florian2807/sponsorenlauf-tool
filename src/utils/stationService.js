import { dbAll, dbRun } from './database.js';

export const STATION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;

export const recordStationHeartbeat = async (deviceId, { scanned = false } = {}) => {
    if (!STATION_ID_PATTERN.test(String(deviceId || ''))) throw new Error('Ungültige Stations-ID');
    const now = new Date().toISOString();
    await dbRun(
        `INSERT INTO station_activity (device_id, last_seen_at, last_scan_at, scan_count)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(device_id) DO UPDATE SET
            last_seen_at = excluded.last_seen_at,
            last_scan_at = CASE WHEN ? THEN excluded.last_scan_at ELSE station_activity.last_scan_at END,
            scan_count = station_activity.scan_count + ?`,
        [deviceId, now, scanned ? now : null, scanned ? 1 : 0, scanned ? 1 : 0, scanned ? 1 : 0]
    );
    // Station IDs are browser-generated. Keep abandoned browsers from growing
    // this operational table forever.
    await dbRun('DELETE FROM station_activity WHERE last_seen_at < ?', [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ]);
    await dbRun(`DELETE FROM station_activity WHERE device_id NOT IN (
        SELECT device_id FROM station_activity ORDER BY last_seen_at DESC LIMIT 500
    )`);
};

export const getRecentStations = async (minutes = 15) => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    return dbAll(
        `SELECT device_id AS deviceId, last_seen_at AS lastSeenAt,
                last_scan_at AS lastScanAt, scan_count AS scanCount
         FROM station_activity WHERE last_seen_at >= ? ORDER BY last_seen_at DESC`,
        [cutoff]
    );
};
