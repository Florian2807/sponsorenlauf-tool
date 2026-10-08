import { dbAll } from '../../utils/database.js';
import { handleError, handleMethodNotAllowed } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return handleMethodNotAllowed(res, ['GET']);
    const q = req.query.q;
    if (typeof q !== 'string' || q.trim().length < 1 || q.length > 100) {
        return res.status(400).json({ message: 'Bitte einen Namen, eine Klasse oder eine ID eingeben' });
    }
    try {
        res.setHeader('Cache-Control', 'no-store');
        const students = await dbAll(`SELECT id, vorname, nachname, klasse, geschlecht,
            (SELECT COUNT(*) FROM rounds WHERE student_id = students.id) AS "roundCount",
            (SELECT MAX(id) FROM rounds WHERE student_id = students.id) AS "roundVersion" FROM students CROSS JOIN (SELECT ?::text AS needle) search
            WHERE position(needle in lower(concat_ws(' ', vorname, nachname))) > 0
                OR position(needle in lower(concat_ws(' ', nachname, vorname))) > 0
                OR position(needle in lower(klasse)) > 0 OR position(needle in id::text) > 0
            ORDER BY (id::text = needle) DESC,
                (position(needle in lower(concat_ws(' ', vorname, nachname))) = 1) DESC,
                lower(concat_ws(' ', vorname, nachname)), id LIMIT 8`, [q.trim().toLocaleLowerCase('de')]);
        return res.status(200).json({ students });
    } catch (error) { return handleError(res, error, 500, 'Schülersuche fehlgeschlagen'); }
}
