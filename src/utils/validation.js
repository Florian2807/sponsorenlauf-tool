// Gemeinsame Konstanten für Loading-States
export const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Gemeinsame Form-Validation-Regeln
export const VALIDATION_RULES = {
    required: (value) => !!value && value.trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (min) => (value) => value && value.length >= min,
    maxLength: (max) => (value) => value && value.length <= max
};

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

// Standard-Error-Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    NOT_FOUND: 'Der angeforderte Datensatz wurde nicht gefunden.',
    UNAUTHORIZED: 'Sie sind nicht berechtigt, diese Aktion auszuführen.',
    VALIDATION_ERROR: 'Die eingegebenen Daten sind ungültig.',
    GENERIC_ERROR: 'Ein unerwarteter Fehler ist aufgetreten.'
};
