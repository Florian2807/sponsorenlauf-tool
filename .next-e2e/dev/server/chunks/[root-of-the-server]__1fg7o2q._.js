module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[project]/src/pages/api/admin-auth.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/adminAuthService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/apiHelpers.js [api] (ecmascript)");
;
;
const getClientKey = (req)=>String((process.env.SPONSORENLAUF_TRUST_PROXY === 'true' ? req.headers['x-forwarded-for']?.split(',')[0]?.trim() : null) || req.socket?.remoteAddress || 'local').slice(0, 100);
const hasSafeOrigin = (req)=>{
    if (req.headers['sec-fetch-site'] === 'cross-site') return false;
    const origin = req.headers.origin;
    if (!origin) return true;
    try {
        return new URL(origin).host === req.headers.host;
    } catch  {
        return false;
    }
};
const issueSession = async (res)=>{
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["createAdminSession"])();
    res.setHeader('Set-Cookie', (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["buildAdminCookie"])(session.token));
    return session;
};
async function handler(req, res) {
    try {
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getRequestCookie"])(req, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["ADMIN_COOKIE_NAME"]);
        if (req.method === 'GET') {
            const [configured, authenticated] = await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["isAdminConfigured"])(),
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["verifyAdminSessionToken"])(token)
            ]);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleSuccess"])(res, {
                configured,
                authenticated
            }, 'Administratorstatus geladen');
        }
        if (req.method !== 'POST') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleMethodNotAllowed"])(res, [
            'GET',
            'POST'
        ]);
        if (!hasSafeOrigin(req)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Unsichere Anfrage blockiert'), 403);
        const action = req.body?.action;
        if (action === 'logout') {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["revokeAdminSession"])(token);
            res.setHeader('Set-Cookie', (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["buildAdminCookie"])('', {
                clear: true
            }));
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleSuccess"])(res, {
                authenticated: false
            }, 'Abgemeldet');
        }
        if (action === 'setup') {
            if (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["isAdminConfigured"])()) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('PIN bereits eingerichtet'), 409);
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["validateAdminPin"])(req.body?.pin) || req.body?.pin !== req.body?.confirmation) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('PIN muss aus Ziffern bestehen und übereinstimmen'), 400);
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["setAdminPin"])(req.body.pin);
            await issueSession(res);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleSuccess"])(res, {
                configured: true,
                authenticated: true
            }, 'Administrator-PIN eingerichtet', 201);
        }
        if (action === 'login') {
            const clientKey = getClientKey(req);
            const attempt = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getLoginAttempt"])(clientKey);
            if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Zu viele Versuche. Bitte fünf Minuten warten.'), 429);
            }
            if (!await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["verifyAdminPin"])(req.body?.pin)) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["recordFailedLogin"])(clientKey);
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Administrator-PIN ist falsch'), 401);
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["clearFailedLogins"])(clientKey);
            await issueSession(res);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleSuccess"])(res, {
                configured: true,
                authenticated: true
            }, 'Angemeldet');
        }
        if (action === 'change-pin') {
            if (!await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["verifyAdminSessionToken"])(token)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Nicht autorisiert'), 401);
            if (!await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["verifyAdminPin"])(req.body?.currentPin)) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Aktuelle PIN ist falsch'), 401);
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["validateAdminPin"])(req.body?.newPin) || req.body?.newPin !== req.body?.confirmation) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Neue PIN muss aus Ziffern bestehen und übereinstimmen'), 400);
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$adminAuthService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["setAdminPin"])(req.body.newPin, {
                requireExisting: true
            });
            await issueSession(res);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleSuccess"])(res, {
                configured: true,
                authenticated: true
            }, 'Administrator-PIN geändert');
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Ungültige Aktion'), 400);
    } catch (error) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, error, 500, 'Administrator-Anmeldung fehlgeschlagen');
    }
}
}),
"[project]/src/utils/adminAuthService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ADMIN_COOKIE_NAME",
    ()=>ADMIN_COOKIE_NAME,
    "ADMIN_SESSION_SECONDS",
    ()=>ADMIN_SESSION_SECONDS,
    "buildAdminCookie",
    ()=>buildAdminCookie,
    "clearFailedLogins",
    ()=>clearFailedLogins,
    "createAdminSession",
    ()=>createAdminSession,
    "getLoginAttempt",
    ()=>getLoginAttempt,
    "getRequestCookie",
    ()=>getRequestCookie,
    "isAdminConfigured",
    ()=>isAdminConfigured,
    "recordFailedLogin",
    ()=>recordFailedLogin,
    "revokeAdminSession",
    ()=>revokeAdminSession,
    "setAdminPin",
    ()=>setAdminPin,
    "validateAdminPin",
    ()=>validateAdminPin,
    "verifyAdminPin",
    ()=>verifyAdminPin,
    "verifyAdminSessionToken",
    ()=>verifyAdminSessionToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$util__$5b$external$5d$__$28$util$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/util [external] (util, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
;
;
;
const ADMIN_COOKIE_NAME = 'sponsorenlauf_admin';
const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
const scryptAsync = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$util__$5b$external$5d$__$28$util$2c$__cjs$29$__["promisify"])(__TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].scrypt);
const hashToken = (token)=>__TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHash('sha256').update(token).digest('hex');
const timingSafeEqualHex = (left, right)=>{
    try {
        const leftBuffer = Buffer.from(left, 'hex');
        const rightBuffer = Buffer.from(right, 'hex');
        return leftBuffer.length === rightBuffer.length && __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(leftBuffer, rightBuffer);
    } catch  {
        return false;
    }
};
const validateAdminPin = (pin)=>/^\d+$/.test(String(pin || ''));
const derivePinHash = async (pin, salt)=>(await scryptAsync(String(pin), salt, 64)).toString('hex');
const isAdminConfigured = async ()=>Boolean(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT id FROM admin_credentials WHERE id = 1'));
const setAdminPin = async (pin, { requireExisting = false } = {})=>{
    if (!validateAdminPin(pin)) {
        throw new Error('Die Administrator-PIN darf nur aus Ziffern bestehen.');
    }
    const salt = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(16).toString('hex');
    const pinHash = await derivePinHash(pin, salt);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbImmediateTransaction"])((db)=>new Promise((resolve, reject)=>{
            const query = requireExisting ? `UPDATE admin_credentials SET pin_salt = ?, pin_hash = ?,
                   updated_at = CURRENT_TIMESTAMP WHERE id = 1` : 'INSERT INTO admin_credentials (id, pin_salt, pin_hash) VALUES (1, ?, ?)';
            const params = requireExisting ? [
                salt,
                pinHash
            ] : [
                salt,
                pinHash
            ];
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
                db.run('DELETE FROM admin_sessions', (sessionError)=>{
                    if (sessionError) reject(sessionError);
                    else resolve();
                });
            });
        }));
};
const verifyAdminPin = async (pin)=>{
    const credential = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT pin_salt, pin_hash FROM admin_credentials WHERE id = 1');
    if (!credential || !validateAdminPin(pin)) return false;
    const candidate = await derivePinHash(pin, credential.pin_salt);
    return timingSafeEqualHex(candidate, credential.pin_hash);
};
const createAdminSession = async ()=>{
    const token = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000).toISOString();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('DELETE FROM admin_sessions WHERE expires_at <= ?', [
        new Date().toISOString()
    ]);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)', [
        hashToken(token),
        expiresAt
    ]);
    return {
        token,
        expiresAt
    };
};
const verifyAdminSessionToken = async (token)=>{
    if (!token || typeof token !== 'string' || token.length > 200) return false;
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > ?', [
        hashToken(token),
        new Date().toISOString()
    ]);
    return Boolean(session);
};
const revokeAdminSession = async (token)=>{
    if (token) await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('DELETE FROM admin_sessions WHERE token_hash = ?', [
        hashToken(token)
    ]);
};
const getRequestCookie = (req, name = ADMIN_COOKIE_NAME)=>{
    const cookieHeader = req.headers?.cookie || '';
    const match = cookieHeader.split(';').map((part)=>part.trim()).find((part)=>part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};
const buildAdminCookie = (token, { clear = false } = {})=>{
    const secure = process.env.SPONSORENLAUF_COOKIE_SECURE === 'true';
    const value = clear ? '' : encodeURIComponent(token);
    const maxAge = clear ? 0 : ADMIN_SESSION_SECONDS;
    return `${ADMIN_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
};
const getLoginAttempt = async (clientKey)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT failed_count, locked_until FROM admin_login_attempts WHERE client_key = ?', [
        clientKey
    ]);
const recordFailedLogin = async (clientKey)=>{
    const lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbImmediateTransaction"])((db)=>new Promise((resolve, reject)=>{
            db.run(`INSERT INTO admin_login_attempts (client_key, failed_count, locked_until)
             VALUES (?, 1, NULL)
             ON CONFLICT(client_key) DO UPDATE SET
                 failed_count = admin_login_attempts.failed_count + 1,
                 locked_until = CASE
                     WHEN admin_login_attempts.failed_count + 1 >= 5 THEN ?
                     ELSE NULL
                 END,
                 updated_at = CURRENT_TIMESTAMP`, [
                clientKey,
                lockUntil
            ], (writeError)=>{
                if (writeError) {
                    reject(writeError);
                    return;
                }
                db.get('SELECT failed_count, locked_until FROM admin_login_attempts WHERE client_key = ?', [
                    clientKey
                ], (readError, row)=>{
                    if (readError) reject(readError);
                    else resolve({
                        failedCount: row.failed_count,
                        lockedUntil: row.locked_until
                    });
                });
            });
        }));
};
const clearFailedLogins = async (clientKey)=>{
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('DELETE FROM admin_login_attempts WHERE client_key = ?', [
        clientKey
    ]);
};
}),
"[project]/src/utils/apiHelpers.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Standard HTTP Response Helpers für API-Endpunkte
 */ /**
 * Behandelt nicht erlaubte HTTP-Methoden
 * @param {Object} res Response-Objekt
 * @param {Array<string>} allowedMethods Erlaubte HTTP-Methoden
 * @returns {Object} HTTP 405 Response
 */ __turbopack_context__.s([
    "createPagination",
    ()=>createPagination,
    "createSimpleGetHandler",
    ()=>createSimpleGetHandler,
    "handleError",
    ()=>handleError,
    "handleMethodNotAllowed",
    ()=>handleMethodNotAllowed,
    "handleNotFound",
    ()=>handleNotFound,
    "handleSuccess",
    ()=>handleSuccess,
    "handleValidationError",
    ()=>handleValidationError,
    "parseQueryArray",
    ()=>parseQueryArray,
    "sanitizeInput",
    ()=>sanitizeInput,
    "validateRequiredFields",
    ()=>validateRequiredFields
]);
const handleMethodNotAllowed = (res, allowedMethods = [])=>{
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({
        success: false,
        message: `Method not allowed. Allowed: ${allowedMethods.join(', ')}`
    });
};
const handleSuccess = (res, data = null, message = 'Operation successful', status = 200)=>{
    const response = {
        success: true,
        message
    };
    if (data !== null) response.data = data;
    return res.status(status).json(response);
};
const handleError = (res, error, status = 500, customMessage = null)=>{
    if (status >= 500) {
        console.error('API Error:', error);
    }
    const message = customMessage || error.message || 'Ein unerwarteter Fehler ist aufgetreten';
    return res.status(status).json({
        success: false,
        message,
        ...("TURBOPACK compile-time value", "development") === 'development' && {
            stack: error.stack
        }
    });
};
const handleValidationError = (res, errors = [])=>{
    return res.status(400).json({
        success: false,
        message: 'Validierungsfehler',
        errors: Array.isArray(errors) ? errors : [
            errors
        ]
    });
};
const handleNotFound = (res, resource = 'Ressource')=>{
    return res.status(404).json({
        success: false,
        message: `${resource} nicht gefunden`
    });
};
const parseQueryArray = (value)=>{
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((v)=>v.trim()).filter(Boolean);
    return [
        value
    ];
};
const validateRequiredFields = (req, requiredFields = [])=>{
    const body = req.body || {};
    const missing = [];
    requiredFields.forEach((field)=>{
        if (!body[field] || typeof body[field] === 'string' && !body[field].trim()) {
            missing.push(field);
        }
    });
    return missing;
};
const sanitizeInput = (input)=>{
    if (typeof input !== 'string') return input;
    return input.trim();
};
const createPagination = (page = 1, limit = 50)=>{
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;
    return {
        offset,
        limit: limitNum,
        page: pageNum
    };
};
const createSimpleGetHandler = (serviceFunction, successMessage, errorMessage)=>{
    return async (req, res)=>{
        if (req.method !== 'GET') {
            return handleMethodNotAllowed(res, [
                'GET'
            ]);
        }
        try {
            const result = await serviceFunction();
            return handleSuccess(res, result, successMessage);
        } catch (error) {
            return handleError(res, error, 500, errorMessage);
        }
    };
};
}),
"[project]/src/utils/constants.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Konstanten für häufig verwendete API-Endpunkte
__turbopack_context__.s([
    "API_ENDPOINTS",
    ()=>API_ENDPOINTS,
    "DATABASE_PATH",
    ()=>DATABASE_PATH,
    "calculateTimeDifference",
    ()=>calculateTimeDifference,
    "downloadFile",
    ()=>downloadFile,
    "formatCurrency",
    ()=>formatCurrency,
    "formatDate",
    ()=>formatDate,
    "getNextId",
    ()=>getNextId,
    "timeAgo",
    ()=>timeAgo
]);
const API_ENDPOINTS = {
    STUDENTS: '/api/getAllStudents',
    TEACHERS: '/api/getAllTeachers',
    CLASSES: '/api/getAvailableClasses',
    CLASS_STRUCTURE: '/api/classStructure',
    STATISTICS: '/api/statistics',
    GENERATE_LABELS: '/api/generate-labels',
    DELETE_ALL_STUDENTS: '/api/deleteAllStudents',
    EXPORT_EXCEL: '/api/exportExcel',
    EXPORT_SPENDEN: '/api/exportSpenden',
    EXPORT_STATISTICS_HTML: '/api/exportStatisticsHtml',
    SEND_MAILS: '/api/send-mails',
    DONATIONS: '/api/donations'
};
const DATABASE_PATH = './database.db';
const downloadFile = (blob, filename)=>{
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
const formatCurrency = (value)=>{
    if (value === null || value === undefined) return '0,00€';
    const numericValue = parseFloat(value).toFixed(2);
    const [euros, cents] = numericValue.split('.');
    return `${euros},${cents}€`;
};
const formatDate = (timestamp)=>{
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit'
    };
    return timestamp.toLocaleTimeString(undefined, timeOptions);
};
const timeAgo = (now, pastDate)=>{
    const diffInSeconds = Math.floor((now - new Date(pastDate)) / 1000);
    if (diffInSeconds < 2) return "jetzt";
    if (diffInSeconds < 60) return `vor ${diffInSeconds} Sekunden`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Minuten`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `vor ${diffInHours} Stunden`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `vor ${diffInDays} Tagen`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `vor ${diffInMonths} Monaten`;
    return `vor ${Math.floor(diffInMonths / 12)} Jahren`;
};
const getNextId = (items)=>{
    return Math.max(...items.map((item)=>parseInt(item.id, 10)), 0) + 1;
};
const calculateTimeDifference = (currentTimestamp, previousTimestamp)=>{
    if (!previousTimestamp || !currentTimestamp) return null;
    const diffInMs = new Date(currentTimestamp) - new Date(previousTimestamp);
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInSeconds < 60) {
        return `${diffInSeconds} Sek.`;
    } else if (diffInMinutes < 60) {
        const remainingSeconds = diffInSeconds % 60;
        return remainingSeconds > 0 ? `${diffInMinutes} Min. ${remainingSeconds} Sek.` : `${diffInMinutes} Min.`;
    } else if (diffInHours < 24) {
        const remainingMinutes = diffInMinutes % 60;
        return remainingMinutes > 0 ? `${diffInHours} Std. ${remainingMinutes} Min.` : `${diffInHours} Std.`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        const remainingHours = diffInHours % 24;
        return remainingHours > 0 ? `${diffInDays} Tag(e) ${remainingHours} Std.` : `${diffInDays} Tag(e)`;
    }
};
}),
"[project]/src/utils/database.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDbConnection",
    ()=>createDbConnection,
    "createPlaceholders",
    ()=>createPlaceholders,
    "dbAll",
    ()=>dbAll,
    "dbBatchInsert",
    ()=>dbBatchInsert,
    "dbGet",
    ()=>dbGet,
    "dbImmediateTransaction",
    ()=>dbImmediateTransaction,
    "dbRun",
    ()=>dbRun,
    "dbTransaction",
    ()=>dbTransaction,
    "getDatabasePath",
    ()=>getDatabasePath
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__ = __turbopack_context__.i("[externals]/sqlite3 [external] (sqlite3, cjs, [project]/node_modules/sqlite3)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/constants.js [api] (ecmascript)");
;
;
const getDatabasePath = ()=>process.env.SPONSORENLAUF_DATABASE_PATH || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$constants$2e$js__$5b$api$5d$__$28$ecmascript$29$__["DATABASE_PATH"];
const createDbConnection = ()=>{
    const db = new __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].Database(getDatabasePath());
    db.configure('busyTimeout', 5000);
    db.serialize(()=>{
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
    });
    return db;
};
const dbAll = (query, params = [])=>{
    return new Promise((resolve, reject)=>{
        const db = createDbConnection();
        db.all(query, params, (err, rows)=>{
            db.close();
            if (err) reject(err);
            else resolve(rows);
        });
    });
};
const dbGet = (query, params = [])=>{
    return new Promise((resolve, reject)=>{
        const db = createDbConnection();
        db.get(query, params, (err, row)=>{
            db.close();
            if (err) reject(err);
            else resolve(row || null);
        });
    });
};
const dbRun = (query, params = [])=>{
    return new Promise((resolve, reject)=>{
        const db = createDbConnection();
        db.run(query, params, function(err) {
            db.close();
            if (err) reject(err);
            else resolve({
                lastID: this.lastID,
                changes: this.changes
            });
        });
    });
};
const dbTransaction = (operations, { mode = 'DEFERRED' } = {})=>{
    return new Promise((resolve, reject)=>{
        const db = createDbConnection();
        const normalizedMode = mode === 'IMMEDIATE' ? 'IMMEDIATE' : 'DEFERRED';
        db.run(`BEGIN ${normalizedMode} TRANSACTION`, async (beginError)=>{
            if (beginError) {
                db.close();
                reject(beginError);
                return;
            }
            try {
                const result = await operations(db);
                db.run('COMMIT', (commitError)=>{
                    db.close();
                    if (commitError) reject(commitError);
                    else resolve(result);
                });
            } catch (error) {
                db.run('ROLLBACK', ()=>{
                    db.close();
                    reject(error);
                });
            }
        });
    });
};
const dbImmediateTransaction = (operations)=>dbTransaction(operations, {
        mode: 'IMMEDIATE'
    });
const dbBatchInsert = (query, values)=>{
    return new Promise((resolve, reject)=>{
        const db = createDbConnection();
        db.serialize(()=>{
            db.run('BEGIN TRANSACTION');
            db.run(query, values, function(err) {
                if (err) {
                    db.run('ROLLBACK', ()=>{
                        db.close();
                        reject(err);
                    });
                } else {
                    db.run('COMMIT', (commitErr)=>{
                        db.close();
                        if (commitErr) reject(commitErr);
                        else resolve({
                            lastID: this.lastID,
                            changes: this.changes
                        });
                    });
                }
            });
        });
    });
};
const createPlaceholders = (items)=>{
    return items.map(()=>'?').join(',');
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1fg7o2q._.js.map