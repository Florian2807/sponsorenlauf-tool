import { dbAll, dbGet } from './database.js';
import { getAvailableClasses, getClassStructure } from './classService.js';
import { groupClassesByGrade } from './classFilterGroups.js';

// Lists never need individual laps or donation transactions.
const fields = `s.id, s.vorname, s.nachname, s.klasse, s.geschlecht,
    (SELECT COUNT(*) FROM rounds WHERE student_id = s.id) AS "roundCount",
    (SELECT MAX(id) FROM rounds WHERE student_id = s.id) AS "roundVersion",
    COALESCE((SELECT json_agg(id ORDER BY id) FROM replacements WHERE studentID = s.id), '[]') AS replacements`;
const donationFields = `,
    COALESCE((SELECT SUM(amount) FROM expected_donations WHERE student_id = s.id), 0) AS spenden,
    COALESCE((SELECT SUM(amount) FROM received_donations WHERE student_id = s.id), 0) AS "receivedTotal"`;

export const getStudentSummary = async id => dbGet(`SELECT s.id, s.vorname, s.nachname, s.klasse, s.geschlecht,
    (SELECT COUNT(*) FROM rounds WHERE student_id = s.id) AS "roundCount",
    (SELECT MAX(id) FROM rounds WHERE student_id = s.id) AS "roundVersion",
    (SELECT timestamp FROM rounds WHERE student_id = s.id ORDER BY id DESC LIMIT 1) AS "lastTimestamp"
    FROM students s WHERE s.id = ?`, [id]);

export const getStudentDirectory = async query => {
    if (query.view === 'ids') return (await dbAll('SELECT id FROM students ORDER BY id')).map(row => row.id);
    if (query.view === 'student') return dbGet(`SELECT ${fields} FROM students s WHERE s.id = ?`, [Number(query.id) || 0]);
    if (query.page === undefined) return dbAll(`SELECT ${fields}${donationFields} FROM students s ORDER BY s.id`);
    const page = Math.max(0, Math.min(1000000, Number.parseInt(query.page, 10) || 0));
    const size = 200;
    const where = [];
    const values = [];
    const terms = String(query.search || '').trim().slice(0, 100).toLocaleLowerCase('de').split(/\s+/).filter(Boolean);
    for (const term of terms) {
        where.push("position(? in lower(CAST(s.id AS TEXT) || ' ' || s.vorname || ' ' || s.nachname || ' ' || COALESCE(s.klasse, ''))) > 0");
        values.push(term);
    }
    if (query.klasse && query.klasse !== 'all') { where.push('s.klasse = ?'); values.push(String(query.klasse)); }
    if (query.grade) {
        const [classes, structure] = await Promise.all([getAvailableClasses(), getClassStructure()]);
        const names = groupClassesByGrade(classes, structure).find(group => group.grade === query.grade)?.classes || [];
        where.push('s.klasse = ANY(?::text[])');
        values.push(names);
    }
    if (query.filter === 'with-rounds') where.push('EXISTS (SELECT 1 FROM rounds WHERE student_id = s.id)');
    if (query.filter === 'no-rounds') where.push('NOT EXISTS (SELECT 1 FROM rounds WHERE student_id = s.id)');
    if (query.filter === 'with-replacements') where.push('EXISTS (SELECT 1 FROM replacements WHERE studentID = s.id)');
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sortFields = { id: 's.id', vorname: 's.vorname', nachname: 's.nachname', klasse: 's.klasse', geschlecht: 's.geschlecht', roundCount: '"roundCount"' };
    let sort = sortFields[query.sort] || sortFields.id;
    const sortValues = [];
    if (query.sort === 'klasse') {
        const classes = await getAvailableClasses();
        if (classes.length) {
            sort = `CASE s.klasse ${classes.map((_, index) => `WHEN ? THEN ${index}`).join(' ')} ELSE -1 END`;
            sortValues.push(...classes);
        }
    }
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const [students, counts] = await Promise.all([
        dbAll(`SELECT ${fields} FROM students s ${clause} ORDER BY ${sort} ${direction}, s.id LIMIT ? OFFSET ?`, [...values, ...sortValues, size, page * size]),
        dbGet(`SELECT (SELECT COUNT(*) FROM students s ${clause}) AS filtered,
            COUNT(*) AS total, COALESCE(MAX(id), 0) + 1 AS "nextId" FROM students`, values),
    ]);
    return { students, filtered: Number(counts.filtered), total: Number(counts.total), nextId: Number(counts.nextId), page, size };
};
