import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { assertDatabaseWritesAllowed } from './migrationGate.js';
import { createPostgresBackup, isPostgresArchive, verifyPostgresBackup, restorePostgresBackup } from './postgresBackup.js';

const sanitizeLabel = (value) => String(value || 'backup')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'backup';

const MANAGED_BACKUP_PATTERN = /^\d{4}-\d{2}-\d{2}T.+_[0-9a-f]{8}\.(?:db|dump)$/;
const BACKUP_FILENAME_PATTERN = /^(?!\.)[a-zA-Z0-9._-]+\.(?:db|dump)$/;

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
            && !entry.name.includes('_before-web-update_')
            && !entry.name.includes('_migration_')
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

export const verifyApplicationDatabaseBackup = async (backupPath) => {
    if (await isPostgresArchive(backupPath)) return verifyPostgresBackup(backupPath);
    const { verifySqliteApplicationBackup } = await import('./sqliteImport.js');
    return verifySqliteApplicationBackup(backupPath);
};

export const createDatabaseBackup = async ({ reason = 'manual', now = new Date() } = {}) => {
    const backupDirectory = getBackupDirectory();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${sanitizeLabel(reason)}_${randomUUID().slice(0, 8)}.dump`;
    const backupPath = path.join(backupDirectory, filename);
    await fs.mkdir(backupDirectory, { recursive: true, mode: 0o700 });
    try {
        await createPostgresBackup(backupPath);
        await pruneManagedBackups(backupDirectory, filename).catch(() => {});
        return { filename, backupPath };
    } catch (error) { await fs.rm(backupPath, { force: true }); throw error; }
};

export const restoreDatabaseBackup = async (backupPath) => {
    if (!process.env.SPONSORENLAUF_BOOTSTRAP_INTERNAL) assertDatabaseWritesAllowed();
    const beforeReplace = () => createDatabaseBackup({ reason: 'before-restore-final' });
    if (await isPostgresArchive(backupPath)) return restorePostgresBackup(backupPath, { beforeReplace });
    // Restoring an old backup is a SQLite-to-PostgreSQL migration.
    const { importSqlite, verifySqliteApplicationBackup } = await import('./sqliteImport.js');
    await verifySqliteApplicationBackup(backupPath);
    await importSqlite(backupPath, { replace: true, beforeReplace });
    return { restored: true, backend: 'postgres', source: 'sqlite' };
};

export const getBackupDirectory = () => path.resolve(/* turbopackIgnore: true */
    process.env.SPONSORENLAUF_BACKUP_DIRECTORY || '.local-data/backups'
);

export const listDatabaseBackups = async () => {
    const backupDirectory = getBackupDirectory();
    await fs.mkdir(backupDirectory, { recursive: true, mode: 0o700 });
    const entries = await fs.readdir(backupDirectory, { withFileTypes: true });
    const backups = await Promise.all(entries
        .filter((entry) => entry.isFile() && /\.(db|dump)$/.test(entry.name))
        .map(async (entry) => {
            const filePath = path.join(backupDirectory, entry.name);
            const stats = await fs.stat(filePath);
            return {
                filename: entry.name,
                size: stats.size,
                createdAt: stats.mtime.toISOString(),
            };
        }));
    return backups.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

export const deleteDatabaseBackup = async (filename) => {
    if (!BACKUP_FILENAME_PATTERN.test(String(filename || ''))) {
        throw new Error('Ungültiger Backup-Dateiname');
    }

    const backupDirectory = getBackupDirectory();
    const backupPath = path.resolve(backupDirectory, filename);

    if (path.dirname(backupPath) !== backupDirectory) {
        throw new Error('Ungültiger Backup-Pfad');
    }

    await fs.unlink(backupPath);
    return { filename };
};
