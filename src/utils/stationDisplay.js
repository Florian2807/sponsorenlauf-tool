export const stationScopeLabel = (station) => {
    if (!station || station.mode === 'allow' || (!station.classes.length && !station.grades.length)) return 'Alle Klassen';
    return [...station.grades.map((grade) => `Jahrgang ${grade}`), ...station.classes].join(', ');
};
export const stationModeLabel = (station) => (
    !station || station.mode === 'allow' || (!station.classes.length && !station.grades.length)
        ? 'Alle zugelassen' : station.mode === 'warn' ? 'Andere Klassen: Hinweis' : 'Andere Klassen: gesperrt'
);
