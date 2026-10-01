export const cleanScannedStudentId = (rawId, year = new Date().getFullYear()) => {
    if (rawId === null || rawId === undefined) return '';

    return String(rawId)
        .trim()
        .replace(new RegExp(`^${year}[ß/\\-]?`, 'i'), '')
        .trim();
};

export const normalizeReplacementId = (rawId, year = new Date().getFullYear()) => {
    const cleanedId = cleanScannedStudentId(rawId, year).toUpperCase();
    const numericId = cleanedId.startsWith('E') ? cleanedId.slice(1) : cleanedId;

    return /^[1-9]\d*$/.test(numericId) ? numericId : '';
};

export const parseImportedStudentId = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numericValue = typeof value === 'number'
        ? value
        : Number(String(value).trim().replace(',', '.'));

    if (!Number.isInteger(numericValue) || numericValue <= 0) {
        return Number.NaN;
    }

    return numericValue;
};
