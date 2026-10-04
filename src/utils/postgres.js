import { readFileSync } from 'node:fs';
import pg from 'pg';
import { assertDatabaseWritesAllowed } from './migrationGate.js';

const WRITE_LOCK = 731504;
const pools = new Map();
export const isPostgres = () => process.env.SPONSORENLAUF_DATABASE_BACKEND === 'postgres'
    || Boolean(process.env.DATABASE_URL || process.env.PGHOST);
export const postgresConfig = () => {
    if (process.env.SPONSORENLAUF_DATABASE_BACKEND === 'sqlite') throw new Error('Application requires PostgreSQL; use the SQLite import script for legacy data');
    if (!isPostgres()) throw new Error('PostgreSQL configuration is required');
    const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
    return {
        ...(url ? { connectionString: url.toString() } : {}),
        host: url?.hostname || process.env.PGHOST,
        port: Number(url?.port || process.env.PGPORT || 5432),
        database: url ? decodeURIComponent(url.pathname.slice(1)) : process.env.PGDATABASE || 'sponsorenlauf',
        user: url ? decodeURIComponent(url.username) : process.env.PGUSER || 'sponsorenlauf',
        password: process.env.PGPASSWORD_FILE ? readFileSync(process.env.PGPASSWORD_FILE, 'utf8').trim()
            : url ? decodeURIComponent(url.password) : process.env.PGPASSWORD,
        max: Number(process.env.SPONSORENLAUF_DB_POOL_SIZE || 10),
        connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, allowExitOnIdle: true,
        statement_timeout: Number(process.env.SPONSORENLAUF_DB_TIMEOUT_MS || 30000),
    };
};
export const getPostgresPool = () => {
    const config = postgresConfig();
    const key = JSON.stringify(config);
    if (!pools.has(key)) {
        const pool = new pg.Pool(config);
        pool.on('error', (error) => console.error('PostgreSQL pool:', error.message));
        pools.set(key, pool);
    }
    return pools.get(key);
};
export const closePostgresPools = async () => {
    await Promise.all([...pools.values()].map((pool) => pool.end()));
    pools.clear();
};

// Adapt parameterized service queries to PostgreSQL.
// Tokenize so literals, quoted names and comments never receive placeholder edits.
export const postgresSql = (sql) => {
    let position = 0;
    return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?|\b[A-Za-z_][A-Za-z_0-9]*\b/g, (token) => {
        if (token === '?') return `$${++position}`;
        if (/^[A-Za-z_][A-Za-z_0-9]*$/.test(token) && /[a-z]/.test(token) && /[A-Z]/.test(token)) return `"${token}"`;
        if (token === 'CURRENT_TIMESTAMP') return "to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')";
        return token;
    });
};
const normalizeRows = (result) => result.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
    const field = result.fields.find((item) => item.name === key);
    if ([20, 1700].includes(field?.dataTypeID) && value !== null) {
        const number = Number(value);
        if (!Number.isFinite(number) || (field.dataTypeID === 20 && !Number.isSafeInteger(number))) {
            throw new Error(`Database number outside supported range: ${key}`);
        }
        return [key, number];
    }
    return [key, value];
})));
const ID_TABLES = new Set(['classes', 'students', 'teachers', 'rounds', 'replacements', 'expected_donations', 'received_donations', 'admin_credentials', 'smtp_configuration']);
export const pgQuery = async (client, query, params = [], { insertId = false } = {}) => {
    let sql = postgresSql(query);
    const table = /^\s*INSERT\s+INTO\s+(\w+)/i.exec(sql)?.[1];
    if (insertId && ID_TABLES.has(table) && !/\bRETURNING\b/i.test(sql)) sql = sql.trim().replace(/;$/, '') + ' RETURNING id';
    const result = await client.query(sql, params);
    return { rows: normalizeRows(result), changes: result.rowCount || 0 };
};

// Small callback facade for existing transaction services, all on ONE pg client.
// This is not a SQLite connection and never translates PRAGMA or SQLite DDL.
export const transactionClient = (client) => {
    const adapter = {
        query: (query, params = []) => pgQuery(client, query, params),
        run(query, params = [], callback) {
            if (typeof params === 'function') { callback = params; params = []; }
            pgQuery(client, query, params, { insertId: true }).then(
                (result) => callback?.call({ changes: result.changes, lastID: result.rows.at(-1)?.id }, null),
                (error) => callback?.(error),
            );
        },
        get(query, params = [], callback) {
            if (typeof params === 'function') { callback = params; params = []; }
            pgQuery(client, query, params).then((result) => callback(null, result.rows[0] || null), callback);
        },
        all(query, params = [], callback) {
            if (typeof params === 'function') { callback = params; params = []; }
            pgQuery(client, query, params).then((result) => callback(null, result.rows), callback);
        },
        exec(query, callback) { client.query(query).then(() => callback(null), callback); },
        prepare(query) {
            return { run: (...args) => { const callback = args.pop(); adapter.run(query, args, callback); }, finalize() {} };
        },
    };
    return adapter;
};
export const postgresTransaction = async (operations, { exclusive = false } = {}) => {
    if (!process.env.SPONSORENLAUF_BOOTSTRAP_INTERNAL) assertDatabaseWritesAllowed();
    const client = await getPostgresPool().connect();
    try {
        await client.query('BEGIN');
        await client.query(`SELECT pg_advisory_xact_lock${exclusive ? '' : '_shared'}($1)`, [WRITE_LOCK]);
        const result = await operations(transactionClient(client));
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
    } finally { client.release(); }
};
