import { dbAll, dbTransaction } from './database.js';

export const DEVICE_ACTIVE_MS = 90000;
const deviceFields = `d.device_id AS id, d.id AS number,
    COALESCE(d.name, 'Scanner ' || d.id::text) AS name, a.last_seen_at AS "lastSeenAt"`;
const joinDevices = `FROM scan_devices d LEFT JOIN station_activity a ON a.device_id = d.device_id`;
const withStatus = device => ({ ...device, online: Boolean(device.lastSeenAt
    && Date.now() - new Date(device.lastSeenAt).getTime() < DEVICE_ACTIVE_MS) });

export const getScanDevices = async (selected = null) => {
    const cutoff = new Date(Date.now() - DEVICE_ACTIVE_MS).toISOString();
    const rows = await dbAll(`SELECT ${deviceFields} ${joinDevices}
        WHERE (a.last_seen_at >= ? OR d.device_id = ?) AND d.device_id ~ '^[a-zA-Z0-9_-]{8,100}$'
        ORDER BY CASE WHEN d.device_id = ? THEN 0 ELSE 1 END, d.id LIMIT 500`, [cutoff, selected, selected]);
    return rows.map(withStatus);
};

export const getScanDevice = async (deviceId) => {
    const rows = await dbAll(`SELECT ${deviceFields} ${joinDevices} WHERE d.device_id = ?`, [deviceId]);
    return rows[0] ? withStatus(rows[0]) : null;
};

export const renameScanDevice = async (deviceId, name) => dbTransaction(async db => {
    const result = await db.query('UPDATE scan_devices SET name = ? WHERE device_id = ? RETURNING device_id', [name, deviceId]);
    if (!result.rows.length) return null;
    const rows = await db.query(`SELECT ${deviceFields} ${joinDevices} WHERE d.device_id = ?`, [deviceId]);
    const device = withStatus(rows.rows[0]);
    await db.query('SELECT pg_notify(?, ?)', ['scan_feedback', JSON.stringify({ deviceId, device })]);
    return device;
});
