const countDelimiters = (text, delimiter) => {
    let quoted = false;
    let count = 0;
    for (let index = 0; index < Math.min(text.length, 10000); index += 1) {
        const character = text[index];
        if (character === '"') {
            if (quoted && text[index + 1] === '"') index += 1;
            else quoted = !quoted;
        } else if (!quoted && character === delimiter) count += 1;
    }
    return count;
};

export const detectCsvDelimiter = (text) => [';', ',', '\t'].reduce((best, delimiter) => (
    countDelimiters(text, delimiter) > countDelimiters(text, best) ? delimiter : best
), ';');

export const parseCsv = (text) => {
    const content = String(text || '').replace(/^\uFEFF/, '');
    const delimiter = detectCsvDelimiter(content);
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;

    for (let index = 0; index < content.length; index += 1) {
        const character = content[index];
        if (character === '"') {
            if (quoted && content[index + 1] === '"') {
                value += '"';
                index += 1;
            } else quoted = !quoted;
        } else if (character === delimiter && !quoted) {
            row.push(value.trim());
            value = '';
        } else if ((character === '\n' || character === '\r') && !quoted) {
            if (character === '\r' && content[index + 1] === '\n') index += 1;
            row.push(value.trim());
            if (row.some(Boolean)) rows.push(row);
            row = [];
            value = '';
        } else {
            value += character;
        }
    }
    row.push(value.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
};
