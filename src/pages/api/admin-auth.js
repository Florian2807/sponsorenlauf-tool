import {
    ADMIN_COOKIE_NAME,
    buildAdminCookie,
    clearFailedLogins,
    createAdminSession,
    getLoginAttempt,
    getRequestCookie,
    isAdminConfigured,
    recordFailedLogin,
    revokeAdminSession,
    setAdminPin,
    validateAdminPin,
    verifyAdminPin,
    verifyAdminSessionToken,
} from '../../utils/adminAuthService.js';
import { handleError, handleMethodNotAllowed, handleSuccess } from '../../utils/apiHelpers.js';

const getClientKey = (req) => String(
    (process.env.SPONSORENLAUF_TRUST_PROXY === 'true'
        ? req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        : null)
    || req.socket?.remoteAddress
    || 'local'
).slice(0, 100);

const hasSafeOrigin = (req) => {
    if (req.headers['sec-fetch-site'] === 'cross-site') return false;
    const origin = req.headers.origin;
    if (!origin) return true;
    try {
        return new URL(origin).host === req.headers.host;
    } catch {
        return false;
    }
};

const issueSession = async (res) => {
    const session = await createAdminSession();
    res.setHeader('Set-Cookie', buildAdminCookie(session.token));
    return session;
};

export default async function handler(req, res) {
    try {
        const token = getRequestCookie(req, ADMIN_COOKIE_NAME);

        if (req.method === 'GET') {
            const [configured, authenticated] = await Promise.all([
                isAdminConfigured(),
                verifyAdminSessionToken(token),
            ]);
            return handleSuccess(res, { configured, authenticated }, 'Administratorstatus geladen');
        }

        if (req.method !== 'POST') return handleMethodNotAllowed(res, ['GET', 'POST']);
        if (!hasSafeOrigin(req)) return handleError(res, new Error('Unsichere Anfrage blockiert'), 403);

        const action = req.body?.action;
        if (action === 'logout') {
            await revokeAdminSession(token);
            res.setHeader('Set-Cookie', buildAdminCookie('', { clear: true }));
            return handleSuccess(res, { authenticated: false }, 'Abgemeldet');
        }

        if (action === 'setup') {
            if (await isAdminConfigured()) return handleError(res, new Error('PIN bereits eingerichtet'), 409);
            if (!validateAdminPin(req.body?.pin) || req.body?.pin !== req.body?.confirmation) {
                return handleError(res, new Error('PIN muss aus 6 bis 12 Ziffern bestehen und übereinstimmen'), 400);
            }
            await setAdminPin(req.body.pin);
            await issueSession(res);
            return handleSuccess(res, { configured: true, authenticated: true }, 'Administrator-PIN eingerichtet', 201);
        }

        if (action === 'login') {
            const clientKey = getClientKey(req);
            const attempt = await getLoginAttempt(clientKey);
            if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
                return handleError(res, new Error('Zu viele Versuche. Bitte fünf Minuten warten.'), 429);
            }
            if (!await verifyAdminPin(req.body?.pin)) {
                await recordFailedLogin(clientKey);
                return handleError(res, new Error('Administrator-PIN ist falsch'), 401);
            }
            await clearFailedLogins(clientKey);
            await issueSession(res);
            return handleSuccess(res, { configured: true, authenticated: true }, 'Angemeldet');
        }

        if (action === 'change-pin') {
            if (!await verifyAdminSessionToken(token)) return handleError(res, new Error('Nicht autorisiert'), 401);
            if (!await verifyAdminPin(req.body?.currentPin)) return handleError(res, new Error('Aktuelle PIN ist falsch'), 401);
            if (!validateAdminPin(req.body?.newPin) || req.body?.newPin !== req.body?.confirmation) {
                return handleError(res, new Error('Neue PIN muss aus 6 bis 12 Ziffern bestehen und übereinstimmen'), 400);
            }
            await setAdminPin(req.body.newPin, { requireExisting: true });
            await issueSession(res);
            return handleSuccess(res, { configured: true, authenticated: true }, 'Administrator-PIN geändert');
        }

        return handleError(res, new Error('Ungültige Aktion'), 400);
    } catch (error) {
        return handleError(res, error, 500, 'Administrator-Anmeldung fehlgeschlagen');
    }
}
