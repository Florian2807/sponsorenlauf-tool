/**
 * Erweiterte Validierungsfunktionen für die Anwendung
 */

const VALID_GENDERS = ['männlich', 'weiblich', 'divers'];

/**
 * Validiert E-Mail-Adressen
 * @param {string} email E-Mail-Adresse
 * @returns {boolean} True wenn gültig
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validiert Schülerdaten
 * @param {Object} student Schülerobjekt
 * @param {number} index Index für Fehlermeldungen (optional)
 * @returns {Array<string>} Array von Validierungsfehlern
 */
export const validateStudent = (student, index = 0) => {
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

/**
 * Validiert Lehrerdaten
 * @param {Object} teacher Lehrerobjekt
 * @returns {Array<string>} Array von Validierungsfehlern
 */
export const validateTeacher = (teacher) => {
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

/**
 * Validiert einen Geldbetrag
 * @param {string|number} amount Betrag
 * @returns {boolean} True wenn gültig
 */
export const validateAmount = (amount) => {
    if (!amount) return false;

    const numericAmount = typeof amount === 'string'
        ? parseFloat(amount.replace(',', '.').replace('€', ''))
        : amount;

    return !isNaN(numericAmount) && numericAmount > 0;
};

/**
 * Parst einen Geldbetrag zu einer Zahl
 * @param {string|number} amount Betrag
 * @returns {number} Geparster Betrag
 */
export const parseAmount = (amount) => {
    if (typeof amount === 'number') return amount;
    return parseFloat(amount.replace(',', '.').replace('€', ''));
};

/**
 * Validiert eine Schüler-ID
 * @param {string|number} id Schüler-ID
 * @returns {boolean} True wenn gültig
 */
export const validateStudentId = (id) => {
    if (!id) return false;

    // Normale ID oder Ersatz-ID (E-prefix)
    if (typeof id === 'string' && id.startsWith('E')) {
        const numPart = id.substring(1);
        return !isNaN(parseInt(numPart, 10));
    }

    const numId = parseInt(id, 10);
    return !isNaN(numId) && numId > 0;
};

/**
 * Normalisiert eine Schüler-ID (entfernt E-Prefix)
 * @param {string|number} id Schüler-ID
 * @returns {number} Normalisierte ID
 */
export const normalizeStudentId = (id) => {
    if (typeof id === 'string' && id.startsWith('E')) {
        return parseInt(id.substring(1), 10);
    }
    return parseInt(id, 10);
};

/**
 * Validiert Zeitstempel
 * @param {string|Date} timestamp Zeitstempel
 * @returns {boolean} True wenn gültig
 */
export const validateTimestamp = (timestamp) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
};

/**
 * Validiert Array von Zeitstempeln
 * @param {Array} timestamps Array von Zeitstempeln
 * @returns {Array<string>} Array von Validierungsfehlern
 */
export const validateTimestamps = (timestamps) => {
    const errors = [];

    if (!Array.isArray(timestamps)) {
        errors.push('Zeitstempel müssen als Array übergeben werden');
        return errors;
    }

    timestamps.forEach((timestamp, index) => {
        if (!validateTimestamp(timestamp)) {
            errors.push(`Ungültiger Zeitstempel an Position ${index + 1}`);
        }
    });

    return errors;
};
