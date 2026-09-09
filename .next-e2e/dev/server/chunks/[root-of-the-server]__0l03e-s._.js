module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

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
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/src/pages/api/students/[id]/timestamps.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/studentService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/apiHelpers.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation.js [api] (ecmascript)");
;
;
;
async function handler(req, res) {
    if (req.method !== 'GET') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleMethodNotAllowed"])(res, [
            'GET'
        ]);
    }
    try {
        const { id } = req.query;
        if (!id || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2e$js__$5b$api$5d$__$28$ecmascript$29$__["validateStudentId"])(id)) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleValidationError"])(res, [
                'Gültige Schüler-ID ist erforderlich'
            ]);
        }
        // Behandle Ersatz-IDs (E-prefix)
        let studentId = id;
        if (typeof id === 'string' && id.startsWith('E')) {
            studentId = await resolveReplacementId(id);
            if (!studentId) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, new Error('Ersatz-ID nicht gefunden'), 404);
            }
        }
        const rounds = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$studentService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getRoundRecordsByStudentId"])(studentId);
        const timestamps = rounds.map((round)=>round.timestamp);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleSuccess"])(res, {
            rounds,
            timestamps
        }, 'Timestamps erfolgreich geladen');
    } catch (error) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$apiHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["handleError"])(res, error, 500, 'Fehler beim Laden der Timestamps');
    }
}
/**
 * Löst eine Ersatz-ID zur entsprechenden Schüler-ID auf
 * @param {string} replacementId Ersatz-ID (z.B. "E1")
 * @returns {Promise<number|null>} Schüler-ID oder null
 */ async function resolveReplacementId(replacementId) {
    const { dbGet } = await __turbopack_context__.A("[project]/src/utils/database.js [api] (ecmascript, async loader)");
    const numericId = replacementId.replace('E', '');
    const row = await dbGet('SELECT studentID FROM replacements WHERE id = ?', [
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
"[project]/src/utils/backupService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDatabaseBackup",
    ()=>createDatabaseBackup,
    "getBackupDirectory",
    ()=>getBackupDirectory,
    "listDatabaseBackups",
    ()=>listDatabaseBackups,
    "restoreDatabaseBackup",
    ()=>restoreDatabaseBackup,
    "verifyApplicationDatabaseBackup",
    ()=>verifyApplicationDatabaseBackup,
    "verifyDatabaseBackup",
    ()=>verifyDatabaseBackup
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__ = __turbopack_context__.i("[externals]/sqlite3 [external] (sqlite3, cjs, [project]/node_modules/sqlite3)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$migrationService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/migrationService.js [api] (ecmascript)");
;
;
;
;
;
;
const sanitizeLabel = (value)=>String(value || 'backup').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'backup';
const MANAGED_BACKUP_PATTERN = /^\d{4}-\d{2}-\d{2}T.+_[0-9a-f]{8}\.db$/;
const pruneManagedBackups = async (backupDirectory, currentFilename)=>{
    const configuredLimit = Number.parseInt(process.env.SPONSORENLAUF_MAX_BACKUPS || '20', 10);
    const limit = Number.isInteger(configuredLimit) && configuredLimit > 0 ? Math.min(configuredLimit, 365) : 20;
    const entries = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readdir(backupDirectory, {
        withFileTypes: true
    });
    const candidates = await Promise.all(entries.filter((entry)=>entry.isFile() && entry.name !== currentFilename && MANAGED_BACKUP_PATTERN.test(entry.name)).map(async (entry)=>{
        const filePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(backupDirectory, entry.name);
        const fileStats = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].stat(filePath);
        return {
            filePath,
            modifiedAt: fileStats.mtimeMs
        };
    }));
    candidates.sort((left, right)=>right.modifiedAt - left.modifiedAt);
    const removable = candidates.slice(Math.max(0, limit - 1));
    await Promise.all(removable.map(({ filePath })=>__TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].rm(filePath, {
            force: true
        })));
};
const closeDatabase = (db)=>new Promise((resolve, reject)=>{
        db.close((error)=>{
            if (error) reject(error);
            else resolve();
        });
    });
const runBackup = (db, filePath, filenameIsDestination = true)=>new Promise((resolve, reject)=>{
        const backup = db.backup(filePath, 'main', 'main', filenameIsDestination);
        let settled = false;
        const finish = (error = null)=>{
            if (settled) return;
            settled = true;
            backup.finish(()=>{
                if (error) reject(error);
                else resolve();
            });
        };
        const copyNextPages = ()=>{
            backup.step(256, (error, completed)=>{
                if (error) {
                    finish(error);
                    return;
                }
                if (completed) {
                    finish();
                    return;
                }
                setImmediate(copyNextPages);
            });
        };
        copyNextPages();
    });
const verifyDatabaseBackup = (backupPath)=>new Promise((resolve, reject)=>{
        const backupDb = new __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].Database(backupPath, __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].OPEN_READONLY, (openError)=>{
            if (openError) {
                reject(openError);
                return;
            }
            backupDb.get('PRAGMA integrity_check', async (integrityError, row)=>{
                try {
                    if (integrityError) throw integrityError;
                    if (row?.integrity_check !== 'ok') {
                        throw new Error(`Backup-Integritätsprüfung fehlgeschlagen: ${row?.integrity_check || 'unbekannt'}`);
                    }
                    await closeDatabase(backupDb);
                    resolve();
                } catch (error) {
                    try {
                        await closeDatabase(backupDb);
                    } catch  {
                    // Preserve the integrity-check error.
                    }
                    reject(error);
                }
            });
        });
    });
const REQUIRED_APPLICATION_TABLES = [
    'classes',
    'students',
    'replacements',
    'teachers',
    'rounds',
    'expected_donations',
    'received_donations',
    'settings'
];
const verifyApplicationDatabaseBackup = async (backupPath)=>{
    await verifyDatabaseBackup(backupPath);
    return new Promise((resolve, reject)=>{
        const backupDb = new __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].Database(backupPath, __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].OPEN_READONLY, (openError)=>{
            if (openError) {
                reject(openError);
                return;
            }
            const placeholders = REQUIRED_APPLICATION_TABLES.map(()=>'?').join(',');
            backupDb.all(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`, REQUIRED_APPLICATION_TABLES, async (queryError, rows)=>{
                try {
                    if (queryError) throw queryError;
                    const found = new Set((rows || []).map((row)=>row.name));
                    const missing = REQUIRED_APPLICATION_TABLES.filter((table)=>!found.has(table));
                    if (missing.length > 0) {
                        throw new Error(`Keine gültige Sponsorenlauf-Datenbank; Tabellen fehlen: ${missing.join(', ')}`);
                    }
                    await closeDatabase(backupDb);
                    resolve();
                } catch (error) {
                    try {
                        await closeDatabase(backupDb);
                    } catch  {
                    // Preserve the schema validation error.
                    }
                    reject(error);
                }
            });
        });
    });
};
const createDatabaseBackup = async ({ reason = 'manual', now = new Date() } = {})=>{
    const databasePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(/* turbopackIgnore: true */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getDatabasePath"])());
    const backupDirectory = getBackupDirectory();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${sanitizeLabel(reason)}_${(0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])().slice(0, 8)}.db`;
    const backupPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(backupDirectory, filename);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(backupDirectory, {
        recursive: true,
        mode: 0o700
    });
    // A dedicated read-only source connection also works while another
    // connection holds BEGIN IMMEDIATE to freeze concurrent writes.
    const db = new __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].Database(databasePath, __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].OPEN_READONLY);
    db.configure('busyTimeout', 5000);
    try {
        await runBackup(db, backupPath);
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].chmod(backupPath, 0o600);
        await verifyDatabaseBackup(backupPath);
        try {
            await pruneManagedBackups(backupDirectory, filename);
        } catch  {
        // A valid new backup should remain usable even if old-file cleanup fails.
        }
        return {
            filename,
            backupPath
        };
    } catch (error) {
        try {
            await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].rm(backupPath, {
                force: true
            });
        } catch  {
        // Keep the original backup error as the actionable failure.
        }
        throw error;
    } finally{
        await closeDatabase(db);
    }
};
const restoreDatabaseBackup = async (backupPath)=>{
    const resolvedBackupPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(backupPath);
    const databasePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(/* turbopackIgnore: true */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getDatabasePath"])());
    await verifyApplicationDatabaseBackup(resolvedBackupPath);
    const db = new __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].Database(databasePath);
    db.configure('busyTimeout', 5000);
    try {
        await runBackup(db, resolvedBackupPath, false);
    } finally{
        await closeDatabase(db);
    }
    // Legacy backups are accepted when they contain the recognizable base
    // schema, then upgraded before the application resumes normal operation.
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$migrationService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["runDatabaseMigrations"])();
    const verification = await new Promise((resolve, reject)=>{
        const restoredDb = new __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].Database(databasePath, __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$sqlite3$29$__["default"].OPEN_READONLY);
        restoredDb.get('PRAGMA integrity_check', async (error, row)=>{
            try {
                if (error) throw error;
                await closeDatabase(restoredDb);
                if (row?.integrity_check !== 'ok') {
                    throw new Error('Wiederhergestellte Datenbank ist beschädigt');
                }
                resolve(row.integrity_check);
            } catch (verificationError) {
                try {
                    await closeDatabase(restoredDb);
                } catch  {
                // Preserve the verification error.
                }
                reject(verificationError);
            }
        });
    });
    return {
        restored: verification === 'ok',
        databasePath
    };
};
const getBackupDirectory = ()=>{
    const databasePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(/* turbopackIgnore: true */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getDatabasePath"])());
    return __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(/* turbopackIgnore: true */ process.env.SPONSORENLAUF_BACKUP_DIRECTORY || __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(databasePath), 'backups'));
};
const listDatabaseBackups = async ()=>{
    const backupDirectory = getBackupDirectory();
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(backupDirectory, {
        recursive: true,
        mode: 0o700
    });
    const entries = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readdir(backupDirectory, {
        withFileTypes: true
    });
    const backups = await Promise.all(entries.filter((entry)=>entry.isFile() && entry.name.endsWith('.db')).map(async (entry)=>{
        const filePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(backupDirectory, entry.name);
        const stats = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].stat(filePath);
        return {
            filename: entry.name,
            size: stats.size,
            createdAt: stats.mtime.toISOString()
        };
    }));
    return backups.sort((left, right)=>right.createdAt.localeCompare(left.createdAt));
};
}),
"[project]/src/utils/classService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureClassExists",
    ()=>ensureClassExists,
    "getAvailableClasses",
    ()=>getAvailableClasses,
    "getClassGradeMap",
    ()=>getClassGradeMap,
    "getClassStructure",
    ()=>getClassStructure,
    "getClasses",
    ()=>getClasses,
    "normalizeClassNameForComparison",
    ()=>normalizeClassNameForComparison,
    "resolveCanonicalClassName",
    ()=>resolveCanonicalClassName,
    "sanitizeClassName",
    ()=>sanitizeClassName,
    "syncClassNamesFromList",
    ()=>syncClassNamesFromList,
    "syncClassesToDatabase",
    ()=>syncClassesToDatabase,
    "updateClassStructure",
    ()=>updateClassStructure,
    "validateClassNames",
    ()=>validateClassNames
]);
/**
 * Service für Klassen-Operationen
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$settingsService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/settingsService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$importHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/importHelpers.js [api] (ecmascript)");
;
;
;
const sanitizeClassName = (className)=>{
    const trimmedClassName = String(className || '').trim();
    if (!trimmedClassName) {
        return '';
    }
    const classMatch = trimmedClassName.match(/^0*(\d+)(.*)$/);
    if (!classMatch) {
        return trimmedClassName;
    }
    const [, numericPart, suffix = ''] = classMatch;
    return `${parseInt(numericPart, 10)}${suffix}`;
};
const normalizeClassNameForComparison = (className)=>{
    return JSON.stringify((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$importHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["tokenizeClassName"])(className));
};
const resolveCanonicalClassName = (className, availableClasses = [])=>{
    const trimmedClassName = String(className || '').trim();
    if (!trimmedClassName) {
        return '';
    }
    const match = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$importHelpers$2e$js__$5b$api$5d$__$28$ecmascript$29$__["matchClassName"])(trimmedClassName, availableClasses);
    return [
        'exact',
        'normalized',
        'token'
    ].includes(match.status) ? match.value : sanitizeClassName(trimmedClassName);
};
const deriveGradeFromClassName = (className)=>{
    const normalizedClassName = sanitizeClassName(className);
    const gradeMatch = normalizedClassName.match(/^\d+/);
    if (gradeMatch) {
        return gradeMatch[0];
    }
    return 'Sonstige';
};
const getClassStructure = async ()=>{
    // Hole Klassenstruktur aus den Settings
    const structure = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$settingsService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getSetting"])('class_structure', {});
    return structure;
};
const getAvailableClasses = async ()=>{
    const structure = await getClassStructure();
    const classes = [];
    for(const grade in structure){
        if (Array.isArray(structure[grade])) {
            classes.push(...structure[grade]);
        }
    }
    if (classes.length > 0) {
        return classes;
    }
    const existingClasses = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])("SELECT DISTINCT klasse FROM students WHERE klasse IS NOT NULL AND TRIM(klasse) != '' ORDER BY klasse");
    return existingClasses.map((row)=>row.klasse);
};
const getClassGradeMap = async ()=>{
    const structure = await getClassStructure();
    const gradeMap = {};
    Object.entries(structure).forEach(([grade, classes])=>{
        if (!Array.isArray(classes)) return;
        classes.forEach((className)=>{
            gradeMap[className] = grade;
        });
    });
    return gradeMap;
};
const getClasses = async ()=>{
    // Für Kompatibilität mit bestehenden Funktionen
    return await getAvailableClasses();
};
const updateClassStructure = async (availableClasses)=>{
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$settingsService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["setSetting"])('class_structure', availableClasses);
        await syncClassesToDatabase(availableClasses);
        return {
            success: true,
            message: 'Klassenstruktur erfolgreich aktualisiert',
            availableClasses
        };
    } catch (error) {
        throw new Error('Fehler beim Speichern der Klassenstruktur: ' + error.message);
    }
};
const validateClassNames = async (classNames)=>{
    if (!classNames || classNames.length === 0) {
        return {
            valid: true,
            errors: []
        };
    }
    const availableClasses = await getAvailableClasses();
    const errors = [];
    classNames.forEach((className)=>{
        const resolvedClassName = resolveCanonicalClassName(className, availableClasses);
        if (!availableClasses.includes(resolvedClassName)) {
            errors.push(`Ungültige Klasse: ${className}`);
        }
    });
    return {
        valid: errors.length === 0,
        errors
    };
};
const syncClassesToDatabase = async (structure = null)=>{
    const classStructure = structure || await getClassStructure();
    for (const [grade, classes] of Object.entries(classStructure)){
        if (!Array.isArray(classes)) continue;
        for (const className of classes){
            const normalizedClassName = String(className || '').trim();
            if (!normalizedClassName) continue;
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('INSERT OR IGNORE INTO classes (grade, class_name) VALUES (?, ?)', [
                String(grade || deriveGradeFromClassName(normalizedClassName)).trim(),
                normalizedClassName
            ]);
        }
    }
};
const ensureClassExists = async (className)=>{
    const normalizedClassName = sanitizeClassName(className);
    if (!normalizedClassName) {
        return;
    }
    const gradeMap = await getClassGradeMap();
    const canonicalClassName = resolveCanonicalClassName(normalizedClassName, Object.keys(gradeMap));
    const grade = gradeMap[canonicalClassName] || deriveGradeFromClassName(canonicalClassName);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('INSERT OR IGNORE INTO classes (grade, class_name) VALUES (?, ?)', [
        grade,
        canonicalClassName
    ]);
};
const syncClassNamesFromList = async (classNames = [])=>{
    for (const className of classNames){
        await ensureClassExists(className);
    }
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
"[project]/src/utils/importHelpers.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IMPORT_FIELDS",
    ()=>IMPORT_FIELDS,
    "mapImportedRows",
    ()=>mapImportedRows,
    "matchClassName",
    ()=>matchClassName,
    "normalizeImportedGender",
    ()=>normalizeImportedGender,
    "stripImportMetadata",
    ()=>stripImportMetadata,
    "suggestColumnMappings",
    ()=>suggestColumnMappings,
    "tokenizeClassName",
    ()=>tokenizeClassName,
    "validateMappedRows",
    ()=>validateMappedRows
]);
const HEADER_ALIASES = {
    id: [
        'id',
        'idoptional',
        'schuelerid',
        'schülerid',
        'studentid',
        'barcode',
        'nummer'
    ],
    vorname: [
        'vorname',
        'rufname',
        'firstname',
        'givenname'
    ],
    nachname: [
        'nachname',
        'familienname',
        'surname',
        'lastname'
    ],
    geschlecht: [
        'geschlecht',
        'geschlechtoptional',
        'gender',
        'sex'
    ],
    klasse: [
        'klasse',
        'klasseoptional',
        'class',
        'klassenname',
        'klassenbezeichnung',
        'klassenbez'
    ],
    email: [
        'email',
        'e-mail',
        'emaildienstlich',
        'dienstlicheemail',
        'mail',
        'mailadresse',
        'emailadresse'
    ]
};
const IMPORT_FIELDS = {
    students: [
        {
            key: 'id',
            label: 'Schüler-ID',
            required: false
        },
        {
            key: 'vorname',
            label: 'Vorname',
            required: true
        },
        {
            key: 'nachname',
            label: 'Nachname',
            required: true
        },
        {
            key: 'geschlecht',
            label: 'Geschlecht',
            required: false
        },
        {
            key: 'klasse',
            label: 'Klasse',
            required: true
        }
    ],
    teachers: [
        {
            key: 'vorname',
            label: 'Vorname',
            required: true
        },
        {
            key: 'nachname',
            label: 'Nachname',
            required: true
        },
        {
            key: 'klasse',
            label: 'Klasse',
            required: false
        },
        {
            key: 'email',
            label: 'E-Mail',
            required: true
        }
    ]
};
const normalizeHeader = (value)=>String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, '');
const suggestColumnMappings = (headers, importType)=>{
    const availableFields = IMPORT_FIELDS[importType] || [];
    const used = new Set();
    return headers.map((header)=>{
        const normalizedHeader = normalizeHeader(header);
        const field = availableFields.find(({ key })=>!used.has(key) && HEADER_ALIASES[key]?.some((alias)=>normalizeHeader(alias) === normalizedHeader));
        if (field) used.add(field.key);
        return field?.key || '';
    });
};
const mapImportedRows = (rows, mappings)=>rows.map((sourceRow, sourceIndex)=>{
        const mapped = {
            _sourceIndex: sourceIndex + 2
        };
        mappings.forEach((field, columnIndex)=>{
            if (field) mapped[field] = String(sourceRow[columnIndex] ?? '').trim();
        });
        return mapped;
    }).filter((row)=>Object.entries(row).some(([key, value])=>key !== '_sourceIndex' && value));
const tokenizeClassName = (value)=>{
    const normalized = String(value || '').normalize('NFKC').toLocaleLowerCase('de-DE');
    return (normalized.match(/[\p{L}]+|\d+/gu) || []).map((token)=>/^\d+$/.test(token) ? String(parseInt(token, 10)) : token);
};
const normalizedExactClassName = (value)=>String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE');
const matchClassName = (value, availableClasses = [])=>{
    const rawValue = String(value || '').trim();
    if (!rawValue) return {
        status: 'empty',
        value: '',
        matches: []
    };
    const exactKey = normalizedExactClassName(rawValue);
    const exactMatches = availableClasses.filter((className)=>normalizedExactClassName(className) === exactKey);
    if (exactMatches.length === 1) {
        return {
            status: exactMatches[0] === rawValue ? 'exact' : 'normalized',
            value: exactMatches[0],
            matches: exactMatches
        };
    }
    if (exactMatches.length > 1) {
        return {
            status: 'ambiguous',
            value: rawValue,
            matches: exactMatches
        };
    }
    const tokens = tokenizeClassName(rawValue);
    const tokenKey = JSON.stringify(tokens);
    const tokenMatches = tokens.length === 0 ? [] : availableClasses.filter((className)=>JSON.stringify(tokenizeClassName(className)) === tokenKey);
    if (tokenMatches.length === 1) {
        return {
            status: 'token',
            value: tokenMatches[0],
            matches: tokenMatches
        };
    }
    if (tokenMatches.length > 1) {
        return {
            status: 'ambiguous',
            value: rawValue,
            matches: tokenMatches
        };
    }
    return {
        status: 'unknown',
        value: rawValue,
        matches: []
    };
};
const GENDER_ALIASES = new Map([
    [
        'm',
        'männlich'
    ],
    [
        'mann',
        'männlich'
    ],
    [
        'männlich',
        'männlich'
    ],
    [
        'maennlich',
        'männlich'
    ],
    [
        'male',
        'männlich'
    ],
    [
        'w',
        'weiblich'
    ],
    [
        'f',
        'weiblich'
    ],
    [
        'frau',
        'weiblich'
    ],
    [
        'weiblich',
        'weiblich'
    ],
    [
        'female',
        'weiblich'
    ],
    [
        'd',
        'divers'
    ],
    [
        'divers',
        'divers'
    ],
    [
        'diverse',
        'divers'
    ],
    [
        'x',
        'divers'
    ],
    [
        'nonbinary',
        'divers'
    ],
    [
        'nichtbinär',
        'divers'
    ]
]);
const normalizeImportedGender = (value)=>{
    const rawValue = String(value || '').trim();
    if (!rawValue) return {
        status: 'empty',
        value: ''
    };
    const key = rawValue.toLocaleLowerCase('de-DE').replace(/[\s_-]+/g, '');
    const normalizedValue = GENDER_ALIASES.get(key);
    return normalizedValue ? {
        status: normalizedValue === rawValue ? 'exact' : 'normalized',
        value: normalizedValue
    } : {
        status: 'unknown',
        value: rawValue
    };
};
const validateMappedRows = ({ rows, importType, availableClasses = [], existingStudentIds = [] })=>{
    const idsInFile = new Map();
    const existingIds = new Set(existingStudentIds.map(Number));
    return rows.map((row)=>{
        const normalized = {
            ...row
        };
        const errors = [];
        const warnings = [];
        [
            'vorname',
            'nachname',
            'klasse',
            'email',
            'id'
        ].forEach((field)=>{
            if (normalized[field] !== undefined) normalized[field] = String(normalized[field]).trim();
        });
        if (!normalized.vorname) errors.push('Vorname fehlt');
        if (!normalized.nachname) errors.push('Nachname fehlt');
        if (normalized.vorname?.length > 200) errors.push('Vorname ist zu lang');
        if (normalized.nachname?.length > 200) errors.push('Nachname ist zu lang');
        if (normalized.klasse?.length > 100) errors.push('Klassenname ist zu lang');
        const classMatch = matchClassName(normalized.klasse, availableClasses);
        normalized._classMatch = classMatch;
        if (importType === 'students' && classMatch.status === 'empty') errors.push('Klasse fehlt');
        if (classMatch.status === 'unknown') errors.push(`Klasse „${normalized.klasse}“ existiert nicht`);
        if (classMatch.status === 'ambiguous') errors.push(`Klasse „${normalized.klasse}“ ist nicht eindeutig`);
        if ([
            'normalized',
            'token'
        ].includes(classMatch.status)) {
            warnings.push(`Klasse „${normalized.klasse}“ wird als „${classMatch.value}“ importiert`);
        }
        if (![
            'empty',
            'unknown',
            'ambiguous'
        ].includes(classMatch.status)) normalized.klasse = classMatch.value;
        if (importType === 'students') {
            const gender = normalizeImportedGender(normalized.geschlecht);
            normalized._genderMatch = gender;
            if (gender.status === 'unknown') errors.push(`Geschlecht „${normalized.geschlecht}“ ist ungültig`);
            else normalized.geschlecht = gender.value;
            if (gender.status === 'normalized') warnings.push(`Geschlecht wird als „${gender.value}“ importiert`);
            if (normalized.id) {
                const numericId = Number(normalized.id);
                if (!Number.isInteger(numericId) || numericId <= 0) errors.push('ID muss eine positive ganze Zahl sein');
                else {
                    normalized.id = numericId;
                    if (existingIds.has(numericId)) errors.push(`ID ${numericId} ist bereits vergeben`);
                    idsInFile.set(numericId, (idsInFile.get(numericId) || 0) + 1);
                }
            } else {
                delete normalized.id;
            }
        } else {
            if (!normalized.email) errors.push('E-Mail fehlt');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) errors.push('E-Mail-Adresse ist ungültig');
            if (normalized.email?.length > 320) errors.push('E-Mail-Adresse ist zu lang');
        }
        return {
            ...normalized,
            _errors: errors,
            _warnings: warnings
        };
    }).map((row)=>{
        if (importType === 'students' && row.id && idsInFile.get(row.id) > 1) {
            return {
                ...row,
                _errors: [
                    ...row._errors,
                    `ID ${row.id} ist in der Datei mehrfach vorhanden`
                ]
            };
        }
        return row;
    });
};
const stripImportMetadata = (row)=>Object.fromEntries(Object.entries(row).filter(([key])=>!key.startsWith('_')));
}),
"[project]/src/utils/migrationService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLatestSchemaVersion",
    ()=>getLatestSchemaVersion,
    "runDatabaseMigrations",
    ()=>runDatabaseMigrations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
;
const dbRun = (db, query, params = [])=>new Promise((resolve, reject)=>{
        db.run(query, params, function onRun(error) {
            if (error) reject(error);
            else resolve({
                lastID: this.lastID,
                changes: this.changes
            });
        });
    });
const dbAll = (db, query, params = [])=>new Promise((resolve, reject)=>{
        db.all(query, params, (error, rows)=>{
            if (error) reject(error);
            else resolve(rows || []);
        });
    });
const dbExec = (db, query)=>new Promise((resolve, reject)=>{
        db.exec(query, (error)=>{
            if (error) reject(error);
            else resolve();
        });
    });
const addColumnIfMissing = async (db, table, column, definition)=>{
    const columns = await dbAll(db, `PRAGMA table_info(${table})`);
    if (!columns.some((existingColumn)=>existingColumn.name === column)) {
        await dbRun(db, `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
};
const migrations = [
    {
        version: 1,
        name: 'create-base-schema',
        up: async (db)=>dbExec(db, `
            CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                grade TEXT NOT NULL,
                class_name TEXT NOT NULL UNIQUE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY,
                vorname TEXT NOT NULL,
                nachname TEXT NOT NULL,
                geschlecht TEXT CHECK (geschlecht IN ('männlich', 'weiblich', 'divers') OR geschlecht IS NULL),
                klasse TEXT NOT NULL,
                FOREIGN KEY (klasse) REFERENCES classes(class_name) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS replacements (
                id INTEGER PRIMARY KEY,
                studentID INTEGER REFERENCES students(id)
            );

            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY,
                vorname TEXT NOT NULL,
                nachname TEXT NOT NULL,
                klasse TEXT,
                email TEXT,
                FOREIGN KEY (klasse) REFERENCES classes(class_name) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                student_id INTEGER NOT NULL,
                scan_id TEXT,
                source_device_id TEXT,
                recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS expected_donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS received_donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `)
    },
    {
        version: 2,
        name: 'add-round-scan-metadata',
        up: async (db)=>{
            await addColumnIfMissing(db, 'rounds', 'scan_id', 'TEXT');
            await addColumnIfMissing(db, 'rounds', 'source_device_id', 'TEXT');
            await addColumnIfMissing(db, 'rounds', 'recorded_at', 'TEXT');
            await dbRun(db, 'UPDATE rounds SET recorded_at = timestamp WHERE recorded_at IS NULL');
        }
    },
    {
        version: 3,
        name: 'create-database-indexes',
        up: async (db)=>dbExec(db, `
            CREATE INDEX IF NOT EXISTS idx_rounds_student_id ON rounds(student_id);
            CREATE INDEX IF NOT EXISTS idx_rounds_timestamp ON rounds(timestamp);
            CREATE INDEX IF NOT EXISTS idx_rounds_student_timestamp ON rounds(student_id, timestamp DESC);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_rounds_scan_id ON rounds(scan_id) WHERE scan_id IS NOT NULL;
            CREATE INDEX IF NOT EXISTS idx_expected_donations_student_id ON expected_donations(student_id);
            CREATE INDEX IF NOT EXISTS idx_received_donations_student_id ON received_donations(student_id);
            CREATE INDEX IF NOT EXISTS idx_replacements_student_id ON replacements(studentID);
        `)
    },
    {
        version: 4,
        name: 'add-admin-smtp-and-station-security',
        up: async (db)=>dbExec(db, `
            CREATE TABLE IF NOT EXISTS admin_credentials (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                pin_salt TEXT NOT NULL,
                pin_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admin_sessions (
                token_hash TEXT PRIMARY KEY,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS admin_login_attempts (
                client_key TEXT PRIMARY KEY,
                failed_count INTEGER NOT NULL DEFAULT 0,
                locked_until TEXT,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS smtp_configuration (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                security TEXT NOT NULL CHECK (security IN ('tls', 'starttls', 'none')),
                username TEXT,
                password_encrypted TEXT,
                from_address TEXT NOT NULL,
                from_name TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS station_activity (
                device_id TEXT PRIMARY KEY,
                last_seen_at TEXT NOT NULL,
                last_scan_at TEXT,
                scan_count INTEGER NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
            CREATE INDEX IF NOT EXISTS idx_station_activity_last_seen_at ON station_activity(last_seen_at);
        `)
    },
    {
        version: 5,
        name: 'add-microsoft-graph-mail-provider',
        up: async (db)=>{
            await addColumnIfMissing(db, 'smtp_configuration', 'provider', "TEXT NOT NULL DEFAULT 'smtp'");
            await addColumnIfMissing(db, 'smtp_configuration', 'tenant_id', 'TEXT');
            await addColumnIfMissing(db, 'smtp_configuration', 'client_id', 'TEXT');
            await addColumnIfMissing(db, 'smtp_configuration', 'client_secret_encrypted', 'TEXT');
        }
    }
];
const getLatestSchemaVersion = ()=>migrations.at(-1)?.version || 0;
const runDatabaseMigrations = async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbImmediateTransaction"])(async (db)=>{
        await dbExec(db, `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);
        const appliedRows = await dbAll(db, 'SELECT version FROM schema_migrations ORDER BY version');
        const appliedVersions = new Set(appliedRows.map((row)=>row.version));
        const applied = [];
        for (const migration of migrations){
            if (appliedVersions.has(migration.version)) continue;
            await migration.up(db);
            await dbRun(db, 'INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [
                migration.version,
                migration.name
            ]);
            applied.push(migration.version);
        }
        const currentVersion = getLatestSchemaVersion();
        await dbRun(db, `PRAGMA user_version = ${currentVersion}`);
        return {
            applied,
            currentVersion
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
"[project]/src/utils/studentService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createStudent",
    ()=>createStudent,
    "deleteRoundById",
    ()=>deleteRoundById,
    "deleteRoundByIndex",
    ()=>deleteRoundByIndex,
    "deleteStudent",
    ()=>deleteStudent,
    "getAllStudents",
    ()=>getAllStudents,
    "getMaxStudentId",
    ()=>getMaxStudentId,
    "getPublicStudentById",
    ()=>getPublicStudentById,
    "getRoundRecordsByStudentId",
    ()=>getRoundRecordsByStudentId,
    "getRoundsByStudentId",
    ()=>getRoundsByStudentId,
    "getStudentById",
    ()=>getStudentById,
    "getStudentByIdFast",
    ()=>getStudentByIdFast,
    "getStudentByIdMinimal",
    ()=>getStudentByIdMinimal,
    "updateReplacements",
    ()=>updateReplacements,
    "updateRounds",
    ()=>updateRounds,
    "updateStudent",
    ()=>updateStudent
]);
/**
 * Service für Schüler-Operationen
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/database.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$backupService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/backupService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$classService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/classService.js [api] (ecmascript)");
;
;
;
const getStudentById = async (id)=>{
    const student = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT * FROM students WHERE id = ?', [
        id
    ]);
    if (!student) return null;
    // Lade zusätzliche Daten
    const [replacements, rounds, expectedDonations, receivedDonations] = await Promise.all([
        getReplacementsByStudentId(id),
        getRoundRecordsByStudentId(id),
        getExpectedDonationsByStudentId(id),
        getReceivedDonationsByStudentId(id)
    ]);
    return {
        ...student,
        replacements,
        rounds,
        timestamps: rounds.map((round)=>round.timestamp),
        spenden: expectedDonations.reduce((sum, d)=>sum + d.amount, 0),
        spendenKonto: receivedDonations.map((d)=>d.amount),
        expectedDonations: expectedDonations,
        receivedDonations: receivedDonations
    };
};
const getPublicStudentById = async (id)=>{
    const student = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT id, vorname, nachname, geschlecht, klasse FROM students WHERE id = ?', [
        id
    ]);
    if (!student) return null;
    const rounds = await getRoundRecordsByStudentId(id);
    return {
        ...student,
        rounds,
        timestamps: rounds.map((round)=>round.timestamp)
    };
};
const getStudentByIdFast = async (id)=>{
    const student = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT * FROM students WHERE id = ?', [
        id
    ]);
    if (!student) return null;
    // Lade nur die kritischen Daten ohne Timestamps für bessere Performance
    const [replacements, roundCount, expectedDonations, receivedDonations] = await Promise.all([
        getReplacementsByStudentId(id),
        getRoundCountByStudentId(id),
        getExpectedDonationsByStudentId(id),
        getReceivedDonationsByStudentId(id)
    ]);
    return {
        ...student,
        replacements,
        roundCount,
        spenden: expectedDonations.reduce((sum, d)=>sum + d.amount, 0),
        spendenKonto: receivedDonations.map((d)=>d.amount),
        expectedDonations: expectedDonations,
        receivedDonations: receivedDonations
    };
};
const createStudent = async (studentData)=>{
    const { id, vorname, nachname, klasse, geschlecht } = studentData;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$classService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["ensureClassExists"])(klasse);
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('INSERT INTO students (id, vorname, nachname, klasse, geschlecht) VALUES (?, ?, ?, ?, ?)', [
        id,
        vorname.trim(),
        nachname.trim(),
        klasse.trim(),
        geschlecht || null
    ]);
};
const updateStudent = async (id, studentData)=>{
    const updates = [];
    const params = [];
    if (studentData.klasse !== undefined) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$classService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["ensureClassExists"])(studentData.klasse);
    }
    if (studentData.vorname !== undefined) {
        updates.push('vorname = ?');
        params.push(studentData.vorname.trim());
    }
    if (studentData.nachname !== undefined) {
        updates.push('nachname = ?');
        params.push(studentData.nachname.trim());
    }
    if (studentData.klasse !== undefined) {
        updates.push('klasse = ?');
        params.push(studentData.klasse.trim());
    }
    if (studentData.geschlecht !== undefined) {
        updates.push('geschlecht = ?');
        params.push(studentData.geschlecht || null);
    }
    if (updates.length === 0) {
        return {
            changes: 0
        };
    }
    params.push(id);
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params);
};
const deleteStudent = async (id)=>{
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbImmediateTransaction"])(async (db)=>{
        const backup = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$backupService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["createDatabaseBackup"])({
            reason: `before-delete-student-${id}`
        });
        // Lösche abhängige Daten in der richtigen Reihenfolge
        await new Promise((resolve, reject)=>{
            db.run('DELETE FROM replacements WHERE studentID = ?', [
                id
            ], (err)=>{
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject)=>{
            db.run('DELETE FROM rounds WHERE student_id = ?', [
                id
            ], (err)=>{
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject)=>{
            db.run('DELETE FROM expected_donations WHERE student_id = ?', [
                id
            ], (err)=>{
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject)=>{
            db.run('DELETE FROM received_donations WHERE student_id = ?', [
                id
            ], (err)=>{
                if (err) reject(err);
                else resolve();
            });
        });
        const result = await new Promise((resolve, reject)=>{
            db.run('DELETE FROM students WHERE id = ?', [
                id
            ], function(err) {
                if (err) reject(err);
                else resolve({
                    changes: this.changes
                });
            });
        });
        return {
            ...result,
            backupFilename: backup.filename
        };
    });
};
const getAllStudents = async ()=>{
    const students = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])('SELECT * FROM students ORDER BY klasse, nachname');
    if (students.length === 0) return [];
    const studentIds = students.map((s)=>s.id);
    const placeholders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["createPlaceholders"])(studentIds);
    // Lade alle zusätzlichen Daten parallel
    const [replacements, rounds, expectedDonations, receivedDonations] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])(`SELECT studentID, id FROM replacements WHERE studentID IN (${placeholders})`, studentIds),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])(`SELECT id, student_id, timestamp FROM rounds WHERE student_id IN (${placeholders}) ORDER BY student_id, id DESC`, studentIds),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])(`SELECT student_id, SUM(amount) as total FROM expected_donations WHERE student_id IN (${placeholders}) GROUP BY student_id`, studentIds),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])(`SELECT student_id, amount FROM received_donations WHERE student_id IN (${placeholders}) ORDER BY student_id, created_at DESC`, studentIds)
    ]);
    // Erstelle Maps für effiziente Zuordnung
    const replacementsMap = replacements.reduce((acc, { studentID, id })=>{
        if (!acc[studentID]) acc[studentID] = [];
        acc[studentID].push(id);
        return acc;
    }, {});
    const roundsMap = rounds.reduce((acc, { id, student_id, timestamp })=>{
        if (!acc[student_id]) acc[student_id] = [];
        acc[student_id].push({
            id,
            timestamp
        });
        return acc;
    }, {});
    const expectedMap = expectedDonations.reduce((acc, { student_id, total })=>{
        acc[student_id] = total;
        return acc;
    }, {});
    const receivedMap = receivedDonations.reduce((acc, { student_id, amount })=>{
        if (!acc[student_id]) acc[student_id] = [];
        acc[student_id].push(amount);
        return acc;
    }, {});
    // Kombiniere alle Daten
    return students.map((student)=>({
            ...student,
            replacements: replacementsMap[student.id] || [],
            rounds: roundsMap[student.id] || [],
            timestamps: (roundsMap[student.id] || []).map((round)=>round.timestamp),
            spenden: expectedMap[student.id] || 0,
            spendenKonto: receivedMap[student.id] || []
        }));
};
const updateRounds = async (studentId, timestamps)=>{
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbTransaction"])(async (db)=>{
        // Lösche alte Runden
        await new Promise((resolve, reject)=>{
            db.run('DELETE FROM rounds WHERE student_id = ?', [
                studentId
            ], (err)=>{
                if (err) reject(err);
                else resolve();
            });
        });
        // Füge neue Runden hinzu
        if (timestamps.length > 0) {
            const stmt = db.prepare('INSERT INTO rounds (student_id, timestamp) VALUES (?, ?)');
            for (const timestamp of timestamps){
                await new Promise((resolve, reject)=>{
                    stmt.run(studentId, timestamp, (err)=>{
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            stmt.finalize();
        }
    });
};
const updateReplacements = async (studentId, replacementIds)=>{
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbTransaction"])(async (db)=>{
        // Lösche alte Replacements
        await new Promise((resolve, reject)=>{
            db.run('DELETE FROM replacements WHERE studentID = ?', [
                studentId
            ], (err)=>{
                if (err) reject(err);
                else resolve();
            });
        });
        // Füge neue Replacements hinzu
        if (replacementIds.length > 0) {
            const stmt = db.prepare('INSERT INTO replacements (studentID, id) VALUES (?, ?)');
            for (const replacementId of replacementIds){
                await new Promise((resolve, reject)=>{
                    stmt.run(studentId, replacementId, (err)=>{
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            stmt.finalize();
        }
    });
};
const deleteRoundByIndex = async (studentId, roundIndex)=>{
    const rounds = await getRoundRecordsByStudentId(studentId);
    if (roundIndex < 0 || roundIndex >= rounds.length) {
        throw new Error('Ungültiger Runden-Index');
    }
    return await deleteRoundById(rounds[roundIndex].id, studentId);
};
const deleteRoundById = async (roundId, studentId = null)=>{
    if (!Number.isInteger(Number(roundId)) || Number(roundId) <= 0) {
        throw new Error('Ungültige Runden-ID');
    }
    if (studentId === null || studentId === undefined) {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('DELETE FROM rounds WHERE id = ?', [
            Number(roundId)
        ]);
    }
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbRun"])('DELETE FROM rounds WHERE id = ? AND student_id = ?', [
        Number(roundId),
        Number(studentId)
    ]);
};
const getStudentByIdMinimal = async (id)=>{
    const student = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT * FROM students WHERE id = ?', [
        id
    ]);
    if (!student) return null;
    // Lade nur die absolut nötigen Daten für den Scan-Prozess
    const roundCount = await getRoundCountByStudentId(id);
    return {
        ...student,
        roundCount
    };
};
const getMaxStudentId = async ()=>{
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT MAX(id) as maxId FROM students');
    return result?.maxId || 0;
};
/**
 * Hilfsfunktionen
 */ const getReplacementsByStudentId = async (studentId)=>{
    const rows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])('SELECT id FROM replacements WHERE studentID = ?', [
        studentId
    ]);
    return rows.map((row)=>row.id);
};
const getRoundRecordsByStudentId = async (studentId)=>await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])('SELECT id, timestamp FROM rounds WHERE student_id = ? ORDER BY id DESC', [
        studentId
    ]);
const getRoundsByStudentId = async (studentId)=>{
    const rounds = await getRoundRecordsByStudentId(studentId);
    return rounds.map((round)=>round.timestamp);
};
const getRoundCountByStudentId = async (studentId)=>{
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbGet"])('SELECT COUNT(*) as count FROM rounds WHERE student_id = ?', [
        studentId
    ]);
    return result.count;
};
const getExpectedDonationsByStudentId = async (studentId)=>{
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])('SELECT id, amount, created_at FROM expected_donations WHERE student_id = ? ORDER BY created_at DESC', [
        studentId
    ]);
};
const getReceivedDonationsByStudentId = async (studentId)=>{
    return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$database$2e$js__$5b$api$5d$__$28$ecmascript$29$__["dbAll"])('SELECT id, amount, created_at FROM received_donations WHERE student_id = ? ORDER BY created_at DESC', [
        studentId
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0l03e-s._.js.map