module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/pages/api/stations/heartbeat.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/apiHelpers.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$stationService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/stationService.js [api] (ecmascript)");
;
;
async function handler(req, res) {
    if (req.method !== 'POST') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleMethodNotAllowed"])(res, [
        'POST'
    ]);
    const deviceId = req.body?.deviceId;
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$stationService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["STATION_ID_PATTERN"].test(String(deviceId || ''))) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Ungültige Stations-ID'), 400);
    }
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$stationService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["recordStationHeartbeat"])(deviceId);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleSuccess"])(res, {
            recordedAt: new Date().toISOString()
        }, 'Station aktiv');
    } catch (error) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, error, 500, 'Stationsstatus konnte nicht gespeichert werden');
    }
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
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0b_wyf7._.js.map