module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/pages/api/runden.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/apiHelpers.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$settingsService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/settingsService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$roundService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/roundService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$stationService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/stationService.js [api] (ecmascript)");
;
;
;
;
;
;
const SCAN_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;
async function handler(req, res) {
    if (req.method !== 'POST') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleMethodNotAllowed"])(res, [
            'POST'
        ]);
    }
    try {
        const missing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["validateRequiredFields"])(req, [
            'id'
        ]);
        if (missing.length > 0) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleValidationError"])(res, [
                'Schüler-ID ist erforderlich'
            ]);
        }
        let { id } = req.body;
        const { confirmDoubleScan = false, scanId = null, sourceDeviceId = null } = req.body;
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2e$js__$5b$api$5d$__$28$ecmascript$29$__["validateStudentId"])(id)) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleValidationError"])(res, [
                'Ungültige Schüler-ID'
            ]);
        }
        if (scanId !== null && (typeof scanId !== 'string' || !SCAN_ID_PATTERN.test(scanId))) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleValidationError"])(res, [
                'Ungültige Scan-ID'
            ]);
        }
        if (sourceDeviceId !== null && (typeof sourceDeviceId !== 'string' || !DEVICE_ID_PATTERN.test(sourceDeviceId))) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleValidationError"])(res, [
                'Ungültige Geräte-ID'
            ]);
        }
        if (typeof id === 'string' && id.startsWith('E')) {
            const resolvedId = await resolveReplacementId(id);
            if (!resolvedId) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Ersatz-ID nicht gefunden'), 404);
            }
            id = resolvedId;
        } else {
            id = Number(id);
        }
        const moduleConfig = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$settingsService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getModuleConfig"])();
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$roundService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["recordRound"])({
            studentId: id,
            confirmDoubleScan: confirmDoubleScan === true,
            doubleScanPrevention: moduleConfig.doubleScanPrevention,
            scanId,
            sourceDeviceId
        });
        if (sourceDeviceId && result.accepted) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$stationService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["recordStationHeartbeat"])(sourceDeviceId, {
                scanned: true
            });
        }
        if (!result.accepted && result.blocked) {
            return res.status(400).json({
                success: false,
                error: 'DOUBLE_SCAN_BLOCKED',
                message: `Doppel-Scan blockiert. Bitte warten Sie ${result.thresholdMinutes} Minuten zwischen den Scans.`,
                student: result.student,
                lastRoundTime: result.lastRoundTime,
                timeDifferenceMs: result.timeDifferenceMs,
                thresholdMinutes: result.thresholdMinutes
            });
        }
        if (!result.accepted && result.requiresConfirmation) {
            return res.status(200).json({
                success: true,
                requiresConfirmation: true,
                student: result.student,
                lastRoundTime: result.lastRoundTime,
                timeDifferenceMs: result.timeDifferenceMs,
                thresholdMinutes: result.thresholdMinutes,
                message: 'Doppel-Scan erkannt - Bestätigung erforderlich'
            });
        }
        return res.status(200).json({
            success: true,
            requiresConfirmation: false,
            student: result.student,
            round: result.round,
            idempotentReplay: result.idempotentReplay,
            wasDoubleScan: result.wasDoubleScan,
            message: result.idempotentReplay ? 'Bereits gespeicherte Runde bestätigt' : result.wasDoubleScan ? 'Doppel-Scan bestätigt und gezählt' : 'Runde erfolgreich gezählt'
        });
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$roundService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["RoundServiceError"]) {
            return res.status(error.status).json({
                success: false,
                error: error.code,
                message: error.message,
                ...error.details
            });
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, error, 500, 'Fehler beim Hinzufügen der Runde');
    }
}
async function resolveReplacementId(replacementId) {
    const numericId = replacementId.substring(1);
    const row = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT studentID FROM replacements WHERE id = ?', [
        numericId
    ]);
    return row ? row.studentID : null;
}
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
"[project]/src/utils/roundService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RoundServiceError",
    ()=>RoundServiceError,
    "recordRound",
    ()=>recordRound
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
;
const dbGet = (db, query, params = [])=>new Promise((resolve, reject)=>{
        db.get(query, params, (error, row)=>{
            if (error) reject(error);
            else resolve(row || null);
        });
    });
const dbRun = (db, query, params = [])=>new Promise((resolve, reject)=>{
        db.run(query, params, function onRun(error) {
            if (error) reject(error);
            else resolve({
                lastID: this.lastID,
                changes: this.changes
            });
        });
    });
const normalizePrevention = (prevention = {})=>({
        enabled: prevention.enabled ?? true,
        timeThresholdMinutes: Number.isFinite(prevention.timeThresholdMinutes) ? prevention.timeThresholdMinutes : 5,
        mode: prevention.mode === 'block' ? 'block' : 'confirm'
    });
class RoundServiceError extends Error {
    constructor(message, { code, status = 500, details = {} } = {}){
        super(message);
        this.name = 'RoundServiceError';
        this.code = code;
        this.status = status;
        this.details = details;
    }
}
const recordRound = async ({ studentId, confirmDoubleScan = false, doubleScanPrevention, scanId = null, sourceDeviceId = null, now = new Date() })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbImmediateTransaction"])(async (db)=>{
        const timestamp = now.toISOString();
        const nowMs = now.getTime();
        if (scanId) {
            const existingScan = await dbGet(db, `
            SELECT
                r.id AS roundId,
                r.timestamp AS roundTimestamp,
                s.id AS studentId,
                s.vorname,
                s.nachname,
                s.geschlecht,
                s.klasse,
                (
                SELECT COUNT(*) FROM rounds WHERE student_id = r.student_id
            ) AS roundCount
            FROM rounds r
            JOIN students s ON s.id = r.student_id
            WHERE r.scan_id = ?
        `, [
                scanId
            ]);
            if (existingScan) {
                if (Number(existingScan.studentId) !== Number(studentId)) {
                    throw new RoundServiceError('Scan-ID wurde bereits für einen anderen Schüler verwendet', {
                        code: 'SCAN_ID_CONFLICT',
                        status: 409
                    });
                }
                const { roundId, roundTimestamp: existingTimestamp, studentId: existingStudentId, ...studentData } = existingScan;
                return {
                    accepted: true,
                    idempotentReplay: true,
                    round: {
                        id: roundId,
                        timestamp: existingTimestamp
                    },
                    student: {
                        id: existingStudentId,
                        ...studentData
                    },
                    wasDoubleScan: false
                };
            }
        }
        const student = await dbGet(db, `
        SELECT s.*, COUNT(r.id) AS roundCount
        FROM students s
        LEFT JOIN rounds r ON r.student_id = s.id
        WHERE s.id = ?
        GROUP BY s.id
    `, [
            studentId
        ]);
        if (!student) {
            throw new RoundServiceError('Schüler nicht gefunden', {
                code: 'STUDENT_NOT_FOUND',
                status: 404
            });
        }
        // ID order represents acceptance order and is robust against legacy client
        // clocks that may have stored timestamps in the past or future.
        const lastRound = await dbGet(db, `
        SELECT id, timestamp
        FROM rounds
        WHERE student_id = ?
        ORDER BY id DESC
        LIMIT 1
    `, [
            studentId
        ]);
        const prevention = normalizePrevention(doubleScanPrevention);
        const lastRoundMs = lastRound ? new Date(lastRound.timestamp).getTime() : Number.NaN;
        const timeDifferenceMs = nowMs - lastRoundMs;
        const thresholdMs = prevention.timeThresholdMinutes * 60 * 1000;
        const isDoubleScan = Boolean(lastRound && Number.isFinite(lastRoundMs) && timeDifferenceMs >= 0 && timeDifferenceMs < thresholdMs);
        if (isDoubleScan && prevention.enabled && !confirmDoubleScan) {
            return {
                accepted: false,
                requiresConfirmation: prevention.mode === 'confirm',
                blocked: prevention.mode === 'block',
                student,
                lastRoundTime: lastRound.timestamp,
                timeDifferenceMs,
                thresholdMinutes: prevention.timeThresholdMinutes
            };
        }
        const insert = await dbRun(db, `
        INSERT INTO rounds (timestamp, student_id, scan_id, source_device_id, recorded_at)
        VALUES (?, ?, ?, ?, ?)
    `, [
            timestamp,
            studentId,
            scanId,
            sourceDeviceId,
            timestamp
        ]);
        return {
            accepted: true,
            idempotentReplay: false,
            round: {
                id: insert.lastID,
                timestamp
            },
            student: {
                ...student,
                roundCount: Number(student.roundCount) + 1
            },
            wasDoubleScan: isDoubleScan
        };
    });
}),
"[project]/src/utils/settingsService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteSetting",
    ()=>deleteSetting,
    "getAllSettings",
    ()=>getAllSettings,
    "getModuleConfig",
    ()=>getModuleConfig,
    "getSetting",
    ()=>getSetting,
    "getSettings",
    ()=>getSettings,
    "setSetting",
    ()=>setSetting,
    "setSettings",
    ()=>setSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
;
const getSetting = async (key, defaultValue = null)=>{
    try {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT value FROM settings WHERE key = ?', [
            key
        ]);
        if (result && result.value !== null) {
            // Versuche JSON zu parsen, falls es sich um ein Objekt handelt
            try {
                return JSON.parse(result.value);
            } catch  {
                // Falls es kein JSON ist, gib den Wert direkt zurück
                return result.value;
            }
        }
        return defaultValue;
    } catch (error) {
        console.error(`Fehler beim Abrufen der Einstellung '${key}':`, error);
        return defaultValue;
    }
};
const setSetting = async (key, value)=>{
    try {
        const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])(`INSERT OR REPLACE INTO settings (key, value, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)`, [
            key,
            serializedValue
        ]);
        return true;
    } catch (error) {
        console.error(`Fehler beim Speichern der Einstellung '${key}':`, error);
        throw error;
    }
};
const getSettings = async (keys)=>{
    try {
        const placeholders = keys.map(()=>'?').join(',');
        const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])(`SELECT key, value FROM settings WHERE key IN (${placeholders})`, keys);
        const settings = {};
        results.forEach((row)=>{
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch  {
                settings[row.key] = row.value;
            }
        });
        return settings;
    } catch (error) {
        console.error('Fehler beim Abrufen mehrerer Einstellungen:', error);
        return {};
    }
};
const setSettings = async (settings)=>{
    try {
        const entries = Object.entries(settings);
        for (const [key, value] of entries){
            await setSetting(key, value);
        }
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern mehrerer Einstellungen:', error);
        throw error;
    }
};
const deleteSetting = async (key)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('DELETE FROM settings WHERE key = ?', [
            key
        ]);
        return true;
    } catch (error) {
        console.error(`Fehler beim Löschen der Einstellung '${key}':`, error);
        throw error;
    }
};
const getAllSettings = async ()=>{
    try {
        const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])('SELECT key, value FROM settings ORDER BY key');
        const settings = {};
        results.forEach((row)=>{
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch  {
                settings[row.key] = row.value;
            }
        });
        return settings;
    } catch (error) {
        console.error('Fehler beim Abrufen aller Einstellungen:', error);
        return {};
    }
};
const getModuleConfig = async ()=>{
    try {
        const moduleConfig = await getSetting('module_config', {});
        // Standard-Werte für fehlende Module ergänzen
        return {
            donations: moduleConfig.donations ?? true,
            emails: moduleConfig.emails ?? true,
            teachers: moduleConfig.teachers ?? true,
            doubleScanPrevention: {
                enabled: moduleConfig.doubleScanPrevention?.enabled ?? true,
                timeThresholdMinutes: moduleConfig.doubleScanPrevention?.timeThresholdMinutes ?? 5,
                mode: moduleConfig.doubleScanPrevention?.mode ?? 'confirm',
                allowManualOverride: moduleConfig.doubleScanPrevention?.allowManualOverride ?? true,
                showDetailedWarning: moduleConfig.doubleScanPrevention?.showDetailedWarning ?? true,
                ...moduleConfig.doubleScanPrevention
            }
        };
    } catch (error) {
        console.error('Fehler beim Abrufen der Modul-Konfiguration:', error);
        // Fallback auf Standard-Werte
        return {
            donations: true,
            emails: true,
            teachers: true,
            doubleScanPrevention: {
                enabled: true,
                timeThresholdMinutes: 5,
                mode: 'confirm',
                allowManualOverride: true,
                showDetailedWarning: true
            }
        };
    }
};
}),
"[project]/src/utils/stationService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "STATION_ID_PATTERN",
    ()=>STATION_ID_PATTERN,
    "getRecentStations",
    ()=>getRecentStations,
    "recordStationHeartbeat",
    ()=>recordStationHeartbeat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
;
const STATION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;
const recordStationHeartbeat = async (deviceId, { scanned = false } = {})=>{
    if (!STATION_ID_PATTERN.test(String(deviceId || ''))) throw new Error('Ungültige Stations-ID');
    const now = new Date().toISOString();
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])(`INSERT INTO station_activity (device_id, last_seen_at, last_scan_at, scan_count)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(device_id) DO UPDATE SET
            last_seen_at = excluded.last_seen_at,
            last_scan_at = CASE WHEN ? THEN excluded.last_scan_at ELSE station_activity.last_scan_at END,
            scan_count = station_activity.scan_count + ?`, [
        deviceId,
        now,
        scanned ? now : null,
        scanned ? 1 : 0,
        scanned ? 1 : 0,
        scanned ? 1 : 0
    ]);
    // Station IDs are browser-generated. Keep abandoned browsers from growing
    // this operational table forever.
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('DELETE FROM station_activity WHERE last_seen_at < ?', [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    ]);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])(`DELETE FROM station_activity WHERE device_id NOT IN (
        SELECT device_id FROM station_activity ORDER BY last_seen_at DESC LIMIT 500
    )`);
};
const getRecentStations = async (minutes = 15)=>{
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])(`SELECT device_id AS deviceId, last_seen_at AS lastSeenAt,
                last_scan_at AS lastScanAt, scan_count AS scanCount
         FROM station_activity WHERE last_seen_at >= ? ORDER BY last_seen_at DESC`, [
        cutoff
    ]);
};
}),
"[project]/src/utils/validation.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalizeStudentId",
    ()=>normalizeStudentId,
    "parseAmount",
    ()=>parseAmount,
    "validateAmount",
    ()=>validateAmount,
    "validateEmail",
    ()=>validateEmail,
    "validateStudent",
    ()=>validateStudent,
    "validateStudentId",
    ()=>validateStudentId,
    "validateTeacher",
    ()=>validateTeacher,
    "validateTimestamp",
    ()=>validateTimestamp,
    "validateTimestamps",
    ()=>validateTimestamps
]);
/**
 * Erweiterte Validierungsfunktionen für die Anwendung
 */ const VALID_GENDERS = [
    'männlich',
    'weiblich',
    'divers'
];
const validateEmail = (email)=>{
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};
const validateStudent = (student, index = 0)=>{
    const errors = [];
    const prefix = index > 0 ? `Zeile ${index + 1}: ` : '';
    if (!student.vorname?.trim()) {
        errors.push(`${prefix}Vorname ist erforderlich`);
    }
    if (!student.nachname?.trim()) {
        errors.push(`${prefix}Nachname ist erforderlich`);
    }
    if (!student.klasse?.trim()) {
        errors.push(`${prefix}Klasse ist erforderlich`);
    }
    if (student.geschlecht && !VALID_GENDERS.includes(student.geschlecht)) {
        errors.push(`${prefix}Ungültiges Geschlecht "${student.geschlecht}". Erlaubte Werte: ${VALID_GENDERS.join(', ')}`);
    }
    return errors;
};
const validateTeacher = (teacher)=>{
    const errors = [];
    if (!teacher.vorname?.trim()) {
        errors.push('Vorname ist erforderlich');
    }
    if (!teacher.nachname?.trim()) {
        errors.push('Nachname ist erforderlich');
    }
    if (!teacher.email?.trim()) {
        errors.push('E-Mail ist erforderlich');
    } else if (!validateEmail(teacher.email)) {
        errors.push('Ungültige E-Mail-Adresse');
    }
    return errors;
};
const validateAmount = (amount)=>{
    if (!amount) return false;
    const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(',', '.').replace('€', '')) : amount;
    return !isNaN(numericAmount) && numericAmount > 0;
};
const parseAmount = (amount)=>{
    if (typeof amount === 'number') return amount;
    return parseFloat(amount.replace(',', '.').replace('€', ''));
};
const validateStudentId = (id)=>{
    if (id === null || id === undefined) return false;
    // Normale ID oder Ersatz-ID (E-prefix)
    if (typeof id === 'string') {
        const normalizedId = id.trim();
        if (/^E[1-9]\d*$/.test(normalizedId)) {
            return true;
        }
        return /^[1-9]\d*$/.test(normalizedId);
    }
    return Number.isInteger(id) && id > 0;
};
const normalizeStudentId = (id)=>{
    if (typeof id === 'string' && id.startsWith('E')) {
        return parseInt(id.substring(1), 10);
    }
    return parseInt(id, 10);
};
const validateTimestamp = (timestamp)=>{
    if (!timestamp) return false;
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
};
const validateTimestamps = (timestamps)=>{
    const errors = [];
    if (!Array.isArray(timestamps)) {
        errors.push('Zeitstempel müssen als Array übergeben werden');
        return errors;
    }
    timestamps.forEach((timestamp, index)=>{
        if (!validateTimestamp(timestamp)) {
            errors.push(`Ungültiger Zeitstempel an Position ${index + 1}`);
        }
    });
    return errors;
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0jrwajo._.js.map