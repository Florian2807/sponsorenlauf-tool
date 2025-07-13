/**
 * Standard HTTP Response Helpers für API-Endpunkte
 */

/**
 * Behandelt nicht erlaubte HTTP-Methoden
 * @param {Object} res Response-Objekt
 * @param {Array<string>} allowedMethods Erlaubte HTTP-Methoden
 * @returns {Object} HTTP 405 Response
 */
export const handleMethodNotAllowed = (res, allowedMethods = []) => {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({
        success: false,
        message: `Method not allowed. Allowed: ${allowedMethods.join(', ')}`
    });
};

/**
 * Behandelt Erfolgsfälle
 * @param {Object} res Response-Objekt
 * @param {*} data Daten für die Response
 * @param {string} message Erfolgsmeldung
 * @param {number} status HTTP-Status-Code (default: 200)
 * @returns {Object} Erfolgs-Response
 */
export const handleSuccess = (res, data = null, message = 'Operation successful', status = 200) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;

    return res.status(status).json(response);
};

/**
 * Behandelt Fehler-Fälle
 * @param {Object} res Response-Objekt
 * @param {Error} error Fehler-Objekt
 * @param {number} status HTTP-Status-Code (default: 500)
 * @param {string} customMessage Benutzerdefinierte Fehlermeldung
 * @returns {Object} Fehler-Response
 */
export const handleError = (res, error, status = 500, customMessage = null) => {
    console.error('API Error:', error);

    const message = customMessage || error.message || 'Ein unerwarteter Fehler ist aufgetreten';

    return res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

/**
 * Behandelt Validierungsfehler
 * @param {Object} res Response-Objekt
 * @param {Array<string>} errors Array von Validierungsfehlern
 * @returns {Object} HTTP 400 Response
 */
export const handleValidationError = (res, errors = []) => {
    return res.status(400).json({
        success: false,
        message: 'Validierungsfehler',
        errors: Array.isArray(errors) ? errors : [errors]
    });
};

/**
 * Behandelt "Nicht gefunden"-Fälle
 * @param {Object} res Response-Objekt
 * @param {string} resource Name der nicht gefundenen Ressource
 * @returns {Object} HTTP 404 Response
 */
export const handleNotFound = (res, resource = 'Ressource') => {
    return res.status(404).json({
        success: false,
        message: `${resource} nicht gefunden`
    });
};

/**
 * Parst Query-Parameter zu Arrays
 * @param {string|Array} value Query-Parameter-Wert
 * @returns {Array} Array von Werten
 */
export const parseQueryArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
    return [value];
};

/**
 * Validiert erforderliche Request-Parameter
 * @param {Object} req Request-Objekt
 * @param {Array<string>} requiredFields Array der erforderlichen Felder
 * @returns {Array<string>} Array von fehlenden Feldern
 */
export const validateRequiredFields = (req, requiredFields = []) => {
    const body = req.body || {};
    const missing = [];

    requiredFields.forEach(field => {
        if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
            missing.push(field);
        }
    });

    return missing;
};

/**
 * Sanitisiert Eingabedaten
 * @param {string} input Eingabewert
 * @returns {string} Bereinigte Eingabe
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim();
};

/**
 * Erstellt eine standardisierte Paginierung
 * @param {number} page Seitennummer (1-basiert)
 * @param {number} limit Anzahl Elemente pro Seite
 * @returns {Object} Offset und Limit für SQL-Queries
 */
export const createPagination = (page = 1, limit = 50) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    return { offset, limit: limitNum, page: pageNum };
};
