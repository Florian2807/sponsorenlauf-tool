import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sqlite3 from 'sqlite3';
import { getDatabasePath } from './database.js';

const sanitizeLabel = (value) => String(value || 'backup')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'backup';

const MANAGED_BACKUP_PATTERN = /^\d{4}-\d{2}-\d{2}T.+_[0-9a-f]{8}\.db$/;

const pruneManagedBackups = async (backupDirectory, currentFilename) => {
    const configuredLimit = Number.parseInt(process.env.SPONSORENLAUF_MAX_BACKUPS || '20', 10);
    const limit = Number.isInteger(configuredLimit) && configuredLimit > 0
        ? Math.min(configuredLimit, 365)
        : 20;
    const entries = await fs.readdir(backupDirectory, { withFileTypes: true });
    const candidates = await Promise.all(entries
        .filter((entry) => (
            entry.isFile()
            && entry.name !== currentFilename
            && MANAGED_BACKUP_PATTERN.test(entry.name)
        ))
        .map(async (entry) => {
            const filePath = path.join(backupDirectory, entry.name);
            const fileStats = await fs.stat(filePath);
            return { filePath, modifiedAt: fileStats.mtimeMs };
        }));

    candidates.sort((left, right) => right.modifiedAt - left.modifiedAt);
    const removable = candidates.slice(Math.max(0, limit - 1));
    await Promise.all(removable.map(({ filePath }) => fs.rm(filePath, { force: true })));
};

const closeDatabase = (db) => new Promise((resolve, reject) => {
    db.close((error) => {
        if (error) reject(error);
        else resolve();
    });
});

const runBackup = (db, filePath, filenameIsDestination = true) => new Promise((resolve, reject) => {
    const backup = db.backup(filePath, 'main', 'main', filenameIsDestination);
    let settled = false;

    const finish = (error = null) => {
        if (settled) return;
        settled = true;
        backup.finish(() => {
            if (error) reject(error);
            else resolve();
        });
    };

    const copyNextPages = () => {
        backup.step(256, (error, completed) => {
            if (error) {
                finish(error);
                return;
            }

            if (completed) {
                finish();
                return;
            }

            setImmediate(copyNextPages);
        });
    };

    copyNextPages();
});

const verifyBackup = (backupPath) => new Promise((resolve, reject) => {
    const backupDb = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (openError) => {
        if (openError) {
            reject(openError);
            return;
        }

        backupDb.get('PRAGMA integrity_check', async (integrityError, row) => {
            try {
                if (integrityError) throw integrityError;
                if (row?.integrity_check !== 'ok') {
                    throw new Error(`Backup-Integritätsprüfung fehlgeschlagen: ${row?.integrity_check || 'unbekannt'}`);
                }

                await closeDatabase(backupDb);
                resolve();
            } catch (error) {
                try {
                    await closeDatabase(backupDb);
                } catch {
                    // Preserve the integrity-check error.
                }
                reject(error);
            }
        });
    });
});

/**
 * Creates and verifies a consistent SQLite backup. A caller may hold a write
 * lock on another connection so the snapshot and a following mutation are ordered.
 */
export const createDatabaseBackup = async ({
    reason = 'manual',
    now = new Date(),
} = {}) => {
    const databasePath = path.resolve(/* turbopackIgnore: true */ getDatabasePath());
    const backupDirectory = path.resolve(/* turbopackIgnore: true */
        process.env.SPONSORENLAUF_BACKUP_DIRECTORY || path.join(path.dirname(databasePath), 'backups')
    );
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${sanitizeLabel(reason)}_${randomUUID().slice(0, 8)}.db`;
    const backupPath = path.join(backupDirectory, filename);

    await fs.mkdir(backupDirectory, { recursive: true, mode: 0o700 });

    // A dedicated read-only source connection also works while another
    // connection holds BEGIN IMMEDIATE to freeze concurrent writes.
    const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
    db.configure('busyTimeout', 5000);

    try {
        await runBackup(db, backupPath);
        await fs.chmod(backupPath, 0o600);
        await verifyBackup(backupPath);
        try {
            await pruneManagedBackups(backupDirectory, filename);
        } catch {
            // A valid new backup should remain usable even if old-file cleanup fails.
        }
        return { filename, backupPath };
    } catch (error) {
        try {
            await fs.rm(backupPath, { force: true });
        } catch {
            // Keep the original backup error as the actionable failure.
        }
        throw error;
    } finally {
        await closeDatabase(db);
    }
};

/**
 * Restores a previously verified SQLite snapshot into the configured live DB.
 * This is intended for the startup updater while the web server is stopped.
 */
export const restoreDatabaseBackup = async (backupPath) => {
    const resolvedBackupPath = path.resolve(backupPath);
    const databasePath = path.resolve(/* turbopackIgnore: true */ getDatabasePath());

    await verifyBackup(resolvedBackupPath);

    const db = new sqlite3.Database(databasePath);
    db.configure('busyTimeout', 5000);

    try {
        await runBackup(db, resolvedBackupPath, false);
    } finally {
        await closeDatabase(db);
    }

    const verification = await new Promise((resolve, reject) => {
        const restoredDb = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);
        restoredDb.get('PRAGMA integrity_check', async (error, row) => {
            try {
                if (error) throw error;
                await closeDatabase(restoredDb);
                if (row?.integrity_check !== 'ok') {
                    throw new Error('Wiederhergestellte Datenbank ist beschädigt');
                }
                resolve(row.integrity_check);
            } catch (verificationError) {
                try {
                    await closeDatabase(restoredDb);
                } catch {
                    // Preserve the verification error.
                }
                reject(verificationError);
            }
        });
    });

    return { restored: verification === 'ok', databasePath };
};
