import fs from 'fs/promises';
import path from 'path';
import { dbGet } from '../../utils/database.js';
import { getDatabasePath } from '../../utils/database.js';
import { listDatabaseBackups } from '../../utils/backupService.js';
import { getRecentStations } from '../../utils/stationService.js';
import { getSmtpConfiguration } from '../../utils/smtpService.js';
import { getLatestSchemaVersion } from '../../utils/migrationService.js';
import { getSystemConnectivity } from '../../utils/systemMaintenance.js';
import { handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
    try {
        const databasePath = path.resolve(getDatabasePath());
        const [integrity, lastScan, backups, stations, smtp, connectivity, fileSystem] = await Promise.all([
            dbGet('PRAGMA quick_check'),
            dbGet('SELECT timestamp, student_id AS studentId FROM rounds ORDER BY timestamp DESC LIMIT 1'),
            listDatabaseBackups(),
            getRecentStations(15),
            getSmtpConfiguration(),
            getSystemConnectivity(),
            fs.statfs(path.dirname(databasePath)),
        ]);
        const freeBytes = Number(fileSystem.bavail) * Number(fileSystem.bsize);
        const checks = {
            database: integrity?.quick_check === 'ok',
            diskSpace: freeBytes >= 500 * 1024 * 1024,
            recentBackup: backups[0]
                ? Date.now() - new Date(backups[0].createdAt).getTime() < 24 * 60 * 60 * 1000
                : false,
            smtp: Boolean(smtp),
        };
        return handleSuccess(res, {
            ready: checks.database && checks.diskSpace && checks.recentBackup,
            checks,
            database: { integrity: integrity?.quick_check || 'unknown', schemaVersion: getLatestSchemaVersion() },
            storage: { freeBytes },
            backup: backups[0] || null,
            stations,
            lastScan,
            smtp: { configured: Boolean(smtp), provider: smtp?.provider || null, host: smtp?.host || null },
            connectivity,
            application: { version: process.env.SPONSORENLAUF_VERSION || 'development', uptimeSeconds: Math.round(process.uptime()) },
        }, 'Veranstaltungsbereitschaft geprüft');
    } catch (error) {
        return handleError(res, error, 500, 'Bereitschaftsprüfung fehlgeschlagen');
    }
}
