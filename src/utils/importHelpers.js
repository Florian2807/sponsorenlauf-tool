const HEADER_ALIASES = {
    id: ['id', 'idoptional', 'schuelerid', 'schülerid', 'studentid', 'barcode', 'nummer'],
    vorname: ['vorname', 'rufname', 'firstname', 'givenname'],
    nachname: ['nachname', 'familienname', 'surname', 'lastname'],
    geschlecht: ['geschlecht', 'geschlechtoptional', 'gender', 'sex'],
    klasse: ['klasse', 'klasseoptional', 'class', 'klassenname', 'klassenbezeichnung', 'klassenbez'],
    email: ['email', 'e-mail', 'emaildienstlich', 'dienstlicheemail', 'mail', 'mailadresse', 'emailadresse'],
};

export const IMPORT_FIELDS = {
    students: [
        { key: 'id', label: 'Schüler-ID', required: false },
        { key: 'vorname', label: 'Vorname', required: true },
        { key: 'nachname', label: 'Nachname', required: true },
        { key: 'geschlecht', label: 'Geschlecht', required: false },
        { key: 'klasse', label: 'Klasse', required: true },
    ],
    teachers: [
        { key: 'vorname', label: 'Vorname', required: true },
        { key: 'nachname', label: 'Nachname', required: true },
        { key: 'klasse', label: 'Klasse', required: false },
        { key: 'email', label: 'E-Mail', required: true },
    ],
};

const normalizeHeader = (value) => String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, '');

export const suggestColumnMappings = (headers, importType) => {
    const availableFields = IMPORT_FIELDS[importType] || [];
    const used = new Set();

    return headers.map((header) => {
        const normalizedHeader = normalizeHeader(header);
        const field = availableFields.find(({ key }) => (
            !used.has(key) && HEADER_ALIASES[key]?.some((alias) => normalizeHeader(alias) === normalizedHeader)
        ));
        if (field) used.add(field.key);
        return field?.key || '';
    });
};

export const mapImportedRows = (rows, mappings) => rows
    .map((sourceRow, sourceIndex) => {
        const mapped = { _sourceIndex: sourceIndex + 2 };
        mappings.forEach((field, columnIndex) => {
            if (field) mapped[field] = String(sourceRow[columnIndex] ?? '').trim();
        });
        return mapped;
    })
    .filter((row) => Object.entries(row).some(([key, value]) => key !== '_sourceIndex' && value));

export const tokenizeClassName = (value) => {
    const normalized = String(value || '').normalize('NFKC').toLocaleLowerCase('de-DE');
    return (normalized.match(/[\p{L}]+|\d+/gu) || []).map((token) => (
        /^\d+$/.test(token) ? String(parseInt(token, 10)) : token
    ));
};

const normalizedExactClassName = (value) => String(value || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('de-DE');

export const matchClassName = (value, availableClasses = []) => {
    const rawValue = String(value || '').trim();
    if (!rawValue) return { status: 'empty', value: '', matches: [] };

    const exactKey = normalizedExactClassName(rawValue);
    const exactMatches = availableClasses.filter((className) => normalizedExactClassName(className) === exactKey);
    if (exactMatches.length === 1) {
        return { status: exactMatches[0] === rawValue ? 'exact' : 'normalized', value: exactMatches[0], matches: exactMatches };
    }
    if (exactMatches.length > 1) {
        return { status: 'ambiguous', value: rawValue, matches: exactMatches };
    }

    const tokens = tokenizeClassName(rawValue);
    const tokenKey = JSON.stringify(tokens);
    const tokenMatches = tokens.length === 0 ? [] : availableClasses.filter(
        (className) => JSON.stringify(tokenizeClassName(className)) === tokenKey
    );

    if (tokenMatches.length === 1) {
        return { status: 'token', value: tokenMatches[0], matches: tokenMatches };
    }
    if (tokenMatches.length > 1) {
        return { status: 'ambiguous', value: rawValue, matches: tokenMatches };
    }
    return { status: 'unknown', value: rawValue, matches: [] };
};

const GENDER_ALIASES = new Map([
    ['m', 'männlich'], ['mann', 'männlich'], ['männlich', 'männlich'], ['maennlich', 'männlich'], ['male', 'männlich'],
    ['w', 'weiblich'], ['f', 'weiblich'], ['frau', 'weiblich'], ['weiblich', 'weiblich'], ['female', 'weiblich'],
    ['d', 'divers'], ['divers', 'divers'], ['diverse', 'divers'], ['x', 'divers'], ['nonbinary', 'divers'], ['nichtbinär', 'divers'],
]);

export const normalizeImportedGender = (value) => {
    const rawValue = String(value || '').trim();
    if (!rawValue) return { status: 'empty', value: '' };
    const key = rawValue.toLocaleLowerCase('de-DE').replace(/[\s_-]+/g, '');
    const normalizedValue = GENDER_ALIASES.get(key);
    return normalizedValue
        ? { status: normalizedValue === rawValue ? 'exact' : 'normalized', value: normalizedValue }
        : { status: 'unknown', value: rawValue };
};

export const validateMappedRows = ({ rows, importType, availableClasses = [], existingStudentIds = [] }) => {
    const idsInFile = new Map();
    const existingIds = new Set(existingStudentIds.map(Number));

    return rows.map((row) => {
        const normalized = { ...row };
        const errors = [];
        const warnings = [];

        ['vorname', 'nachname', 'klasse', 'email', 'id'].forEach((field) => {
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
        if (['normalized', 'token'].includes(classMatch.status)) {
            warnings.push(`Klasse „${normalized.klasse}“ wird als „${classMatch.value}“ importiert`);
        }
        if (!['empty', 'unknown', 'ambiguous'].includes(classMatch.status)) normalized.klasse = classMatch.value;

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

        return { ...normalized, _errors: errors, _warnings: warnings };
    }).map((row) => {
        if (importType === 'students' && row.id && idsInFile.get(row.id) > 1) {
            return { ...row, _errors: [...row._errors, `ID ${row.id} ist in der Datei mehrfach vorhanden`] };
        }
        return row;
    });
};

export const stripImportMetadata = (row) => Object.fromEntries(
    Object.entries(row).filter(([key]) => !key.startsWith('_'))
);
