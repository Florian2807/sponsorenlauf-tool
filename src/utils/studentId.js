export const cleanScannedStudentId = (rawId, year = new Date().getFullYear()) => {
    if (rawId === null || rawId === undefined) return '';

    return String(rawId)
        .trim()
        .replace(new RegExp(`^${year}[ß/\\-]?`, 'i'), '')
        .trim();
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
