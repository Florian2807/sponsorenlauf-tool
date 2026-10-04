import fs from 'node:fs';
import path from 'node:path';
export const transitionPath = () => process.env.SPONSORENLAUF_TRANSITION_FILE || null;
export const readTransition = () => {
    const filename = transitionPath();
    if (!filename || !fs.existsSync(/* turbopackIgnore: true */ filename)) return null;
    return JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ filename, 'utf8'));
};
export const writeTransition = (state) => {
    const filename = transitionPath();
    if (!filename) return;
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.${process.pid}.tmp`;
    const fd = fs.openSync(temporary, 'w', 0o600);
    try { fs.writeFileSync(fd, JSON.stringify(state, null, 2)); fs.fsyncSync(fd); }
    finally { fs.closeSync(fd); }
    fs.renameSync(temporary, filename);
    const directory = fs.openSync(path.dirname(filename), 'r');
    try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
};
export const assertDatabaseWritesAllowed = () => {
    const state = readTransition();
    const directory = process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY;
    const statusFile = directory && path.join(directory, 'status.json');
    const status = statusFile && fs.existsSync(/* turbopackIgnore: true */ statusFile) ? JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ statusFile, 'utf8')) : null;
    if ((state && state.phase !== 'completed') || (status?.action === 'update' && ['queued', 'running'].includes(status.state))) {
        const error = new Error('Datenbankmigration läuft. Schreibzugriffe sind gesperrt.');
        error.status = 503;
        throw error;
    }
};
