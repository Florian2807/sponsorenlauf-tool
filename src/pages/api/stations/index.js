import { randomUUID } from 'node:crypto';
import { dbAll, dbGet, dbRun } from '../../../utils/database.js';
import { getModuleConfig } from '../../../utils/settingsService.js';
import { getAvailableClasses, getClassGradeMap } from '../../../utils/classService.js';
import { validateStationRules } from '../../../utils/stationRules.js';
import { handleError, handleMethodNotAllowed } from '../../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (!['GET', 'POST', 'PATCH', 'PUT'].includes(req.method)) return handleMethodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT']);
    try {
        res.setHeader('Cache-Control', 'no-store');
        if (!(await getModuleConfig()).scannerStations) return res.status(403).json({ message: 'Scanner-Stationen sind deaktiviert' });
        if (req.method === 'GET') {
            const stations = await dbAll('SELECT * FROM scanner_stations ORDER BY name, id');
            const classes = await getAvailableClasses();
            const gradeMap = await getClassGradeMap();
            const rows = await dbAll('SELECT class_name, grade FROM classes');
            for (const row of rows) gradeMap[row.class_name] ??= row.grade;
            return res.status(200).json({
                stations: stations.map((station) => ({ ...station, classes: JSON.parse(station.classes), grades: JSON.parse(station.grades) })),
                classes, grades: [...new Set(classes.map((name) => gradeMap[name] || name.match(/^\d+/)?.[0] || 'Sonstige'))].sort(),
            });
        }
        const { id, name, mode, classes, grades } = req.body || {};
        if (req.method === 'POST' || req.method === 'PATCH') {
            if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) return res.status(400).json({ message: 'Stationsname muss 1 bis 100 Zeichen enthalten' });
            if (req.method === 'POST') {
                const stationId = randomUUID();
                await dbRun('INSERT INTO scanner_stations (id, name) VALUES (?, ?)', [stationId, name.trim()]);
                return res.status(201).json({ success: true, id: stationId });
            }
        }
        if (typeof id !== 'string' || !(await dbGet('SELECT id FROM scanner_stations WHERE id = ?', [id]))) return res.status(404).json({ message: 'Scanner-Station nicht gefunden' });
        if (req.method === 'PATCH') {
            if (mode !== undefined || classes !== undefined || grades !== undefined) {
                if (!validateStationRules({ mode, classes, grades })) return res.status(400).json({ message: 'Ungültige Stationsregeln' });
                await dbRun('UPDATE scanner_stations SET name = ?, mode = ?, classes = ?, grades = ? WHERE id = ?',
                    [name.trim(), mode, JSON.stringify([...new Set(classes)]), JSON.stringify([...new Set(grades)]), id]);
            } else {
                await dbRun('UPDATE scanner_stations SET name = ? WHERE id = ?', [name.trim(), id]);
            }
        } else {
            if (!validateStationRules({ mode, classes, grades })) return res.status(400).json({ message: 'Ungültige Stationsregeln' });
            await dbRun('UPDATE scanner_stations SET mode = ?, classes = ?, grades = ? WHERE id = ?',
                [mode, JSON.stringify([...new Set(classes)]), JSON.stringify([...new Set(grades)]), id]);
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        return handleError(res, error, 500, 'Scanner-Stationen konnten nicht gespeichert werden');
    }
}
