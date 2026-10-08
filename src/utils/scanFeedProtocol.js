const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compact = ({ student, ...scan }) => ({ ...scan, studentId: student.id });
const studentsById = scans => new Map(scans.map(scan => [scan.student.id, scan.student]));

// Separate students from scans so names/counts are sent once, even for repeated scans.
export function encodeScanUpdate(previous, scans) {
    const students = studentsById(scans);
    if (!previous) return { type: 'snapshot', scans: scans.map(compact), students: [...students.values()] };
    const before = new Map(previous.map(scan => [scan.id, compact(scan)]));
    const oldStudents = studentsById(previous);
    const ids = scans.map(scan => scan.id);
    const remove = previous.filter(scan => !ids.includes(scan.id)).map(scan => scan.id);
    const changes = scans.map(compact).flatMap(scan => {
        const old = before.get(scan.id);
        if (!old) return [scan];
        const fields = Object.fromEntries(Object.entries(scan).filter(([key, value]) => !equal(old[key], value)));
        return Object.keys(fields).length ? [{ id: scan.id, ...fields }] : [];
    });
    const changedStudents = [...students.values()].filter(student => !equal(oldStudents.get(student.id), student));
    const order = equal(previous.map(scan => scan.id), ids) ? undefined : ids;
    if (!remove.length && !changes.length && !changedStudents.length && !order) return null;
    return { type: 'patch', changes, remove, students: changedStudents, ...(order ? { order } : {}) };
}

export function applyScanUpdate(previous, message) {
    if (message.type === 'snapshot') {
        const students = new Map(message.students.map(student => [student.id, student]));
        return message.scans.map(({ studentId, ...scan }) => ({ ...scan, student: students.get(studentId) }));
    }
    if (message.type !== 'patch') return Array.isArray(message.scans) ? message.scans : previous;
    const students = studentsById(previous);
    for (const student of message.students) students.set(student.id, student);
    const scans = new Map(previous.filter(scan => !message.remove.includes(scan.id)).map(scan => [scan.id, compact(scan)]));
    for (const change of message.changes) scans.set(change.id, { ...scans.get(change.id), ...change });
    return (message.order || [...scans.keys()]).map(id => {
        const { studentId, ...scan } = scans.get(id);
        return { ...scan, student: students.get(studentId) };
    });
}
