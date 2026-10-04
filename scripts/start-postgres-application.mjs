#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { readTransition, writeTransition } from '../src/utils/migrationGate.js';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start'], { stdio: 'inherit', env: process.env });
const timer = setInterval(async () => {
    try {
        const state = readTransition();
        if (!state || state.phase === 'completed') return;
        if (state.phase !== 'awaiting_update') return;
        const status = JSON.parse(await fs.readFile(path.join(process.env.SPONSORENLAUF_MAINTENANCE_DIRECTORY, 'status.json'), 'utf8'));
        if (status.requestId === state.requestId && status.state === 'succeeded') {
            writeTransition({ ...state, phase: 'completed', releasedAt: new Date().toISOString() });
            console.log('Verified update completed; database writes released.');
        }
    } catch (error) { console.error('Migration gate:', error.message); }
}, 1000);
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => { clearInterval(timer); process.exit(signal ? 1 : code || 0); });
