// Rankings repeat students. Transport each student once and reference them by ID.
export function packStatistics(statistics) {
    const students = new Map();
    const pack = value => {
        if (Array.isArray(value)) return value.map(pack);
        if (!value || typeof value !== 'object') return value;
        if (value.id !== undefined && value.vorname !== undefined && value.rounds !== undefined) {
            students.set(value.id, value);
            return { studentRef: value.id };
        }
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, pack(item)]));
    };
    const data = pack(statistics);
    return { data, students: [...students.values()] };
}

export function unpackStatistics(payload) {
    if (!payload.students || !payload.data) return payload;
    const students = new Map(payload.students.map(student => [student.id, student]));
    const unpack = value => {
        if (Array.isArray(value)) return value.map(unpack);
        if (!value || typeof value !== 'object') return value;
        if (value.studentRef !== undefined) return students.get(value.studentRef);
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, unpack(item)]));
    };
    return unpack(payload.data);
}
