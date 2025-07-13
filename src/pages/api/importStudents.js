import { dbAll, dbRun } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';

const VALID_GENDERS = ['männlich', 'weiblich', 'divers'];

function validateStudent(student, index) {
    const errors = [];
    const linePrefix = `Zeile ${index + 1}:`;

    if (!student.vorname?.trim()) errors.push(`${linePrefix} Vorname ist erforderlich`);
    if (!student.nachname?.trim()) errors.push(`${linePrefix} Nachname ist erforderlich`);
    if (!student.klasse?.trim()) errors.push(`${linePrefix} Klasse ist erforderlich`);

    if (student.geschlecht && !VALID_GENDERS.includes(student.geschlecht)) {
        errors.push(`${linePrefix} Ungültiges Geschlecht "${student.geschlecht}". Erlaubte Werte: ${VALID_GENDERS.join(', ')}`);
    }

    return errors;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return handleMethodNotAllowed(res, ['POST']);
    }

    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return handleValidationError(res, ['Keine Schülerdaten empfangen']);
        }

        // Validate students and get available classes in parallel
        const [allErrors, availableClasses] = await Promise.all([
            Promise.resolve(students.flatMap((student, index) => validateStudent(student, index))),
            dbAll('SELECT DISTINCT class_name FROM classes')
        ]);

        if (allErrors.length > 0) {
            return handleValidationError(res, allErrors);
        }

        // Validate classes if any are available
        const classNames = availableClasses.map(row => row.class_name);
        if (classNames.length > 0) {
            const classErrors = students
                .map((student, index) =>
                    !classNames.includes(student.klasse)
                        ? `Zeile ${index + 1}: Ungültige Klasse "${student.klasse}". Verfügbare Klassen: ${classNames.join(', ')}`
                        : null
                )
                .filter(Boolean);

            if (classErrors.length > 0) {
                return handleValidationError(res, classErrors);
            }
        }

        // Insert students
        await Promise.all(students.map(({ vorname, nachname, geschlecht, klasse }) =>
            dbRun(
                'INSERT INTO students (vorname, nachname, geschlecht, klasse) VALUES (?, ?, ?, ?)',
                [vorname.trim(), nachname.trim(), geschlecht || null, klasse.trim()]
            )
        ));

        return handleSuccess(res, { count: students.length }, `${students.length} Schüler erfolgreich hinzugefügt`);

    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Erstellen der Schüler');
    }
}
