import crypto from 'crypto';
import { promisify } from 'util';
import { dbGet, dbImmediateTransaction, dbRun } from './database.js';

export const ADMIN_COOKIE_NAME = 'sponsorenlauf_admin';
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
const scryptAsync = promisify(crypto.scrypt);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const timingSafeEqualHex = (left, right) => {
    try {
        const leftBuffer = Buffer.from(left, 'hex');
        const rightBuffer = Buffer.from(right, 'hex');
        return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
    } catch {
        return false;
    }
};

export const validateAdminPin = (pin) => /^\d+$/.test(String(pin || ''));

const derivePinHash = async (pin, salt) => (
    (await scryptAsync(String(pin), salt, 64)).toString('hex')
);

export const isAdminConfigured = async () => Boolean(
    await dbGet('SELECT id FROM admin_credentials WHERE id = 1')
);

export const setAdminPin = async (pin, { requireExisting = false } = {}) => {
    if (!validateAdminPin(pin)) {
        throw new Error('Die Administrator-PIN darf nur aus Ziffern bestehen.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = await derivePinHash(pin, salt);
    await dbImmediateTransaction((db) => new Promise((resolve, reject) => {
        const query = requireExisting
            ? `UPDATE admin_credentials SET pin_salt = ?, pin_hash = ?,
                   updated_at = CURRENT_TIMESTAMP WHERE id = 1`
            : 'INSERT INTO admin_credentials (id, pin_salt, pin_hash) VALUES (1, ?, ?)';
        const params = requireExisting ? [salt, pinHash] : [salt, pinHash];

        db.run(query, params, function onPinSaved(error) {
            if (error) {
                if (!requireExisting && error.code === 'SQLITE_CONSTRAINT') {
                    reject(new Error('Die Administrator-PIN wurde bereits eingerichtet.'));
                } else {
                    reject(error);
                }
                return;
            }
            if (requireExisting && this.changes === 0) {
                reject(new Error('Es ist noch keine Administrator-PIN eingerichtet.'));
                return;
            }
            db.run('DELETE FROM admin_sessions', (sessionError) => {
                if (sessionError) reject(sessionError);
                else resolve();
            });
        });
    }));
};

export const verifyAdminPin = async (pin) => {
    const credential = await dbGet('SELECT pin_salt, pin_hash FROM admin_credentials WHERE id = 1');
    if (!credential || !validateAdminPin(pin)) return false;
    const candidate = await derivePinHash(pin, credential.pin_salt);
    return timingSafeEqualHex(candidate, credential.pin_hash);
};

export const createAdminSession = async () => {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000).toISOString();
    await dbRun('DELETE FROM admin_sessions WHERE expires_at <= ?', [new Date().toISOString()]);
    await dbRun(
        'INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)',
        [hashToken(token), expiresAt]
    );
    return { token, expiresAt };
};

export const verifyAdminSessionToken = async (token) => {
    if (!token || typeof token !== 'string' || token.length > 200) return false;
    const session = await dbGet(
        'SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > ?',
        [hashToken(token), new Date().toISOString()]
    );
    return Boolean(session);
};

export const revokeAdminSession = async (token) => {
    if (token) await dbRun('DELETE FROM admin_sessions WHERE token_hash = ?', [hashToken(token)]);
};

export const getRequestCookie = (req, name = ADMIN_COOKIE_NAME) => {
    const cookieHeader = req.headers?.cookie || '';
    const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

export const buildAdminCookie = (token, { clear = false } = {}) => {
    const secure = process.env.SPONSORENLAUF_COOKIE_SECURE === 'true';
    const value = clear ? '' : encodeURIComponent(token);
    const maxAge = clear ? 0 : ADMIN_SESSION_SECONDS;
    return `${ADMIN_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
};

export const getLoginAttempt = async (clientKey) => dbGet(
    'SELECT failed_count, locked_until FROM admin_login_attempts WHERE client_key = ?',
    [clientKey]
);

export const recordFailedLogin = async (clientKey) => {
    const lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    return dbImmediateTransaction((db) => new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO admin_login_attempts (client_key, failed_count, locked_until)
             VALUES (?, 1, NULL)
             ON CONFLICT(client_key) DO UPDATE SET
                 failed_count = admin_login_attempts.failed_count + 1,
                 locked_until = CASE
                     WHEN admin_login_attempts.failed_count + 1 >= 5 THEN ?
                     ELSE NULL
                 END,
                 updated_at = CURRENT_TIMESTAMP`,
            [clientKey, lockUntil],
            (writeError) => {
                if (writeError) {
                    reject(writeError);
                    return;
                }
                db.get(
                    'SELECT failed_count, locked_until FROM admin_login_attempts WHERE client_key = ?',
                    [clientKey],
                    (readError, row) => {
                        if (readError) reject(readError);
                        else resolve({ failedCount: row.failed_count, lockedUntil: row.locked_until });
                    }
                );
            }
        );
    }));
};

export const clearFailedLogins = async (clientKey) => {
    await dbRun('DELETE FROM admin_login_attempts WHERE client_key = ?', [clientKey]);
};
