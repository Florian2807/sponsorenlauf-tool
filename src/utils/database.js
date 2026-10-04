import { getPostgresPool, pgQuery, postgresTransaction } from './postgres.js';

export const dbAll = (query, params = []) => pgQuery(getPostgresPool(), query, params).then(result => result.rows);
export const dbGet = (query, params = []) => {
    // Required by the unchanged updater during the single-release migration.
    if (/^PRAGMA integrity_check$/i.test(query.trim())) {
        return getDatabaseStatus().then(status => {
            if (!status.ready) throw new Error('PostgreSQL schema is not ready');
            return { integrity_check: 'ok' };
        });
    }
    return pgQuery(getPostgresPool(), query, params).then(result => result.rows[0] || null);
};
export const dbRun = (query, params = []) => postgresTransaction(db => new Promise((resolve, reject) => {
    db.run(query, params, function(error) {
        if (error) reject(error);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
}));
export const dbTransaction = (operations) => postgresTransaction(operations);
export const dbImmediateTransaction = (operations) => postgresTransaction(operations, { exclusive: true });
export const dbBatchInsert = dbRun;
export const createPlaceholders = (items) => items.map(() => '?').join(',');

/** Connection and application schema readiness, not a physical PostgreSQL checksum scan. */
export const getDatabaseStatus = async () => {
    const required = ['classes', 'students', 'replacements', 'teachers', 'rounds',
        'expected_donations', 'received_donations', 'settings', 'admin_credentials',
        'admin_sessions', 'admin_login_attempts', 'smtp_configuration', 'station_activity'];
    const result = await pgQuery(getPostgresPool(), `SELECT
        (SELECT MAX(version) FROM schema_migrations) AS version,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
            AND table_name = ANY($1::text[])) AS tables`, [required]);
    const { getLatestSchemaVersion } = await import('./migrationService.js');
    return { backend: 'postgres', ready: result.rows[0].tables === required.length && result.rows[0].version === getLatestSchemaVersion(),
        schemaVersion: result.rows[0].version };
};
