export const validateStationRules = (rules) => {
    if (!rules || !['allow', 'warn', 'block'].includes(rules.mode)) return false;
    return ['classes', 'grades'].every((key) => Array.isArray(rules[key])
        && rules[key].length <= 500
        && rules[key].every((value) => typeof value === 'string' && value.trim() && value.length <= 100));
};

export const stationAllowsClass = (station, className, grade) => (
    station.mode === 'allow'
    || (station.classes.length === 0 && station.grades.length === 0)
    || station.classes.includes(className)
    || station.grades.includes(grade)
);
