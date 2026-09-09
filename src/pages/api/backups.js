import fs from 'fs/promises';
import path from 'path';
import {
    createDatabaseBackup,
    deleteDatabaseBackup,
    getBackupDirectory,
    listDatabaseBackups,
    restoreDatabaseBackup,
    verifyApplicationDatabaseBackup,
} from '../../utils/backupService.js';
import { handleError, handleMethodNotAllowed, handleSuccess } from '../../utils/apiHelpers.js';

const safeBackupName = (value) => /^[a-zA-Z0-9._-]+\.db$/.test(String(value || ''));

export const config = { api: { bodyParser: { sizeLimit: '100mb' }, responseLimit: false } };

export default async function handler(req, res) {
    try {
        if (req.method === 'GET' && req.query.filename) {
            if (!safeBackupName(req.query.filename)) return handleError(res, new Error('Ungültiger Dateiname'), 400);
            const filePath = path.join(getBackupDirectory(), req.query.filename);
            await verifyApplicationDatabaseBackup(filePath);
            const contents = await fs.readFile(filePath);
            res.setHeader('Content-Type', 'application/vnd.sqlite3');
            res.setHeader('Content-Disposition', `attachment; filename="${req.query.filename}"`);
            return res.status(200).send(contents);
        }
        if (req.method === 'GET') {
            return handleSuccess(res, { backups: await listDatabaseBackups() }, 'Backups geladen');
        }
        if (req.method !== 'POST') return handleMethodNotAllowed(res, ['GET', 'POST']);

        if (req.body?.action === 'create') {
            const backup = await createDatabaseBackup({ reason: 'manual-export' });
            return handleSuccess(res, backup, 'Backup erstellt', 201);
        }
        if (req.body?.action === 'delete') {
            if (!safeBackupName(req.body?.filename) || String(req.body.filename).startsWith('.')) {
                return handleError(res, new Error('Ungültiger Dateiname'), 400);
            }
            try {
                const deleted = await deleteDatabaseBackup(req.body.filename);
                return handleSuccess(res, deleted, 'Backup gelöscht');
            } catch (deleteError) {
                if (deleteError?.code === 'ENOENT') {
                    return handleError(res, new Error('Backup wurde nicht gefunden'), 404);
                }
                throw deleteError;
            }
        }
        if (req.body?.action === 'restore') {
            const encoded = req.body?.base64;
            if (typeof encoded !== 'string' || !encoded || encoded.length > 140_000_000) {
                return handleError(res, new Error('Backup-Datei fehlt oder ist zu groß'), 400);
            }
            const backupDirectory = getBackupDirectory();
            await fs.mkdir(backupDirectory, { recursive: true, mode: 0o700 });
            const importPath = path.join(backupDirectory, `.restore-${Date.now()}.db`);
            if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
                return handleError(res, new Error('Backup-Datei ist nicht gültig kodiert'), 400);
            }
            const decoded = Buffer.from(encoded, 'base64');
            if (decoded.length > 100_000_000) {
                return handleError(res, new Error('Backup-Datei ist zu groß'), 400);
            }
            await fs.writeFile(importPath, decoded, { mode: 0o600 });
            try {
                await verifyApplicationDatabaseBackup(importPath);
                const safetyBackup = await createDatabaseBackup({ reason: 'before-manual-restore' });
                try {
                    await restoreDatabaseBackup(importPath);
                } catch (restoreError) {
                    await restoreDatabaseBackup(safetyBackup.backupPath);
                    throw restoreError;
                }
                return handleSuccess(res, { restored: true, safetyBackup: safetyBackup.filename }, 'Backup wiederhergestellt');
            } finally {
                await fs.rm(importPath, { force: true });
            }
        }
        return handleError(res, new Error('Ungültige Backup-Aktion'), 400);
    } catch (error) {
        return handleError(res, error, 500, 'Backup-Aktion fehlgeschlagen');
    }
}
