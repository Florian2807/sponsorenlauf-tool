// Migration-only entry point. Never upgrades the live application database.
import { runDatabaseMigrations } from '../src/utils/migration/sqliteSchema.js';
await runDatabaseMigrations();
