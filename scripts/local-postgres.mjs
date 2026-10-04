import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
export const configureLocalPostgres = async () => {
    if (process.env.DATABASE_URL || process.env.PGHOST) return;
    await promisify(execFile)('docker', ['compose', '-f', 'compose.database.yaml', 'up', '-d', '--wait']);
    process.env.PGHOST = '127.0.0.1';
    const execute = promisify(execFile);
    const port = await execute('docker', ['compose', '-f', 'compose.database.yaml', 'port', 'database', '5432']);
    process.env.PGPORT = port.stdout.trim().split(':').at(-1);
    const container = await execute('docker', ['compose', '-f', 'compose.database.yaml', 'ps', '-q', 'database']);
    process.env.SPONSORENLAUF_PG_TOOLS_CONTAINER = container.stdout.trim();
    process.env.PGUSER = 'postgres';
    process.env.PGPASSWORD = 'development-only';
    process.env.PGDATABASE = 'sponsorenlauf_dev';
};
