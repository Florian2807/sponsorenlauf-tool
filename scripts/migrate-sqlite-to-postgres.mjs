#!/usr/bin/env node
import path from 'node:path';
import { importSqlite } from '../src/utils/sqliteImport.js';
import { isPostgres, closePostgresPools } from '../src/utils/postgres.js';
const filename = process.argv[2];
try {
    if (!filename || !isPostgres()) throw new Error('Usage: configure PostgreSQL, then node scripts/migrate-sqlite-to-postgres.mjs <sqlite-file>');
    console.log(JSON.stringify(await importSqlite(path.resolve(filename)), null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await closePostgresPools(); }
