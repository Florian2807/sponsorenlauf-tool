// Path of the legacy SQLite source, never the PostgreSQL application database.
export const getLegacyDatabasePath = () => process.env.SPONSORENLAUF_DATABASE_PATH || './database.db';
