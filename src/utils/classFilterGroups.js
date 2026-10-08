// Share grade assignment between the filter menu and the server-side scan search.
export const groupClassesByGrade = (classNames, structure = {}) => {
    const gradeMap = new Map();
    for (const [grade, names] of Object.entries(structure)) {
        if (Array.isArray(names)) for (const name of names) gradeMap.set(name, grade);
    }
    const groups = new Map();
    for (const name of [...new Set(classNames)].filter(Boolean)) {
        const grade = gradeMap.get(name) || name.match(/^\d+/)?.[0] || 'Sonstige';
        if (!groups.has(grade)) groups.set(grade, []);
        groups.get(grade).push(name);
    }
    const compare = (a, b) => a.localeCompare(b, 'de', { numeric: true });
    return [...groups.entries()].sort(([a], [b]) => compare(a, b)).map(([grade, names]) => ({
        grade, label: grade === 'Sonstige' ? grade : `Stufe ${grade}`, classes: names.sort(compare),
    }));
};
