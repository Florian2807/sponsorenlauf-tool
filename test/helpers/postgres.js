import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { closePostgresPools } from '../../src/utils/postgres.js';

export const createTestDatabase = async () => {
    if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required for database tests');
    const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const name = 'test_' + randomUUID().replaceAll('-', '');
    await admin.query(`CREATE DATABASE "${name}"`);
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.pathname = '/' + name;
    process.env.DATABASE_URL = url.toString();
    delete process.env.SPONSORENLAUF_DATABASE_BACKEND;
    return async () => {
        await closePostgresPools();
        await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
        await admin.end();
    };
};
