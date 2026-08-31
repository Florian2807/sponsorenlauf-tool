#!/usr/bin/env node

import { runDatabaseMigrations } from './src/utils/migrationService.js';

try {
  const result = await runDatabaseMigrations();

  if (result.applied.length === 0) {
    console.log(`Database is up to date (schema version ${result.currentVersion}).`);
  } else {
    console.log(`Applied database migrations: ${result.applied.join(', ')}`);
    console.log(`Database schema is now at version ${result.currentVersion}.`);
  }
} catch (error) {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
}
