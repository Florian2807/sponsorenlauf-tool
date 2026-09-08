export const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const formatCurrencyDisplay = (value) => {
    const amount = roundMoney(value);
    return `${amount.toFixed(2).replace('.', ',')}€`;
};

export const parseCurrencyInput = (amountString) => {
    if (!amountString) return 0;

    const cleaned = String(amountString).replace(/[^\d,.-]/g, '').replace('.', ',');
    const parts = cleaned.split(',');

    if (parts.length === 1) return roundMoney(parseFloat(parts[0] || '0'));

    const euros = parts[0] || '0';
    const cents = (parts[1] || '').padEnd(2, '0').substring(0, 2);
    return roundMoney(parseFloat(`${euros}.${cents}`));
};

export const formatCentsInput = (cents) => {
    const safeCents = Math.max(0, Math.trunc(Number(cents) || 0));
    const euros = Math.floor(safeCents / 100);
    return `${euros},${String(safeCents % 100).padStart(2, '0')}`;
};

export const shiftCurrencyInput = (currentValue, key, replace = false) => {
    const currentCents = replace ? 0 : Math.round(parseCurrencyInput(currentValue) * 100);
    if (/^\d$/.test(key)) return formatCentsInput(currentCents * 10 + Number(key));
    if (key === 'Backspace') return formatCentsInput(Math.floor(currentCents / 10));
    if (key === 'Delete') return '0,00';
    return currentValue;
};

export const getStudentPaymentState = (student) => {
    const expected = roundMoney(student?.spenden ?? 0);
    const received = roundMoney((student?.spendenKonto || []).reduce((sum, value) => sum + Number(value || 0), 0));
    const remaining = roundMoney(expected - received);

    if (expected === 0 && received === 0) {
        return { expected, received, remaining, status: 'unset', label: 'Nicht erfasst', tone: 'neutral' };
    }
    if (expected === 0 && received > 0) {
        return { expected, received, remaining, status: 'unexpected', label: 'Zahlung ohne Soll', tone: 'danger' };
    }
    if (received === 0) {
        return { expected, received, remaining, status: 'open', label: 'Offen', tone: 'warning' };
    }
    if (remaining > 0) {
        return { expected, received, remaining, status: 'partial', label: 'Teilweise bezahlt', tone: 'warning' };
    }
    if (remaining < 0) {
        return { expected, received, remaining, status: 'overpaid', label: 'Überzahlt', tone: 'danger' };
    }
    return { expected, received, remaining, status: 'settled', label: 'Bezahlt', tone: 'success' };
};

export const findStudentSuggestions = (students, query, limit = 8) => {
    const needle = query.trim().toLocaleLowerCase('de');
    if (!needle) return [];

    return students
        .filter((student) => [
            `${student.vorname} ${student.nachname}`,
            `${student.nachname} ${student.vorname}`,
            student.klasse,
            String(student.id)
        ].some((value) => String(value || '').toLocaleLowerCase('de').includes(needle)))
        .sort((left, right) => {
            const leftName = `${left.vorname} ${left.nachname}`.toLocaleLowerCase('de');
            const rightName = `${right.vorname} ${right.nachname}`.toLocaleLowerCase('de');
            const leftStarts = leftName.startsWith(needle) ? 0 : 1;
            const rightStarts = rightName.startsWith(needle) ? 0 : 1;
            return leftStarts - rightStarts || leftName.localeCompare(rightName, 'de');
        })
        .slice(0, limit);
};
