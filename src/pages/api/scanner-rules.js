import { dbAll, dbGet, dbRun } from '../../utils/database.js';
import { getAvailableClasses, getClassGradeMap } from '../../utils/classService.js';
import { validateStationRules } from '../../utils/stationRules.js';
import { handleError, handleMethodNotAllowed } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (!['GET', 'PUT'].includes(req.method)) return handleMethodNotAllowed(res, ['GET', 'PUT']);
    res.setHeader('Cache-Control', 'no-store');
    const deviceId = req.method === 'GET' ? req.query.deviceId : req.body?.deviceId;
    if (typeof deviceId !== 'string' || !/^[a-zA-Z0-9_-]{8,90}$/.test(deviceId)) {
        return res.status(400).json({ message: 'Ungültige Scanner-ID' });
    }
    const id = `rules_${deviceId}`;
    try {
        if (req.method === 'PUT') {
            const { mode, classes, grades } = req.body;
            if (!validateStationRules({ mode, classes, grades })) return res.status(400).json({ message: 'Ungültige Scanner-Regeln' });
            await dbRun(`INSERT INTO scanner_stations (id, name, mode, classes, grades) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET mode = excluded.mode, classes = excluded.classes, grades = excluded.grades`,
            [id, 'Scanner-Regeln', mode, JSON.stringify([...new Set(classes)]), JSON.stringify([...new Set(grades)])]);
            return res.status(200).json({ success: true });
        }
        const stored = await dbGet('SELECT * FROM scanner_stations WHERE id = ?', [id]);
        const classes = await getAvailableClasses();
        const gradeMap = await getClassGradeMap();
        for (const row of await dbAll('SELECT class_name, grade FROM classes')) gradeMap[row.class_name] ??= row.grade;
        return res.status(200).json({
            stations: [{ id, name: 'Scanner-Regeln', mode: stored?.mode || 'allow',
                classes: stored ? JSON.parse(stored.classes) : [], grades: stored ? JSON.parse(stored.grades) : [] }],
            classes, grades: [...new Set(classes.map(name => gradeMap[name] || name.match(/^\d+/)?.[0] || 'Sonstige'))].sort(),
        });
    } catch (error) {
        return handleError(res, error, 500, 'Scanner-Regeln konnten nicht geladen oder gespeichert werden');
    }
}
