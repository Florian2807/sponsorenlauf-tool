import { dbAll, dbBatchInsert } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';

const VALID_GENDERS = ['männlich', 'weiblich', 'divers'];

function formatGender(gender) {
    if (!gender || typeof gender !== 'string') return gender;
    
    const genderMap = {
        'w': 'weiblich',
        'm': 'männlich', 
        'd': 'divers'
    };
    
    const normalizedGender = gender.toLowerCase().trim();
    return genderMap[normalizedGender] || gender;
}

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

        // Format gender abbreviations to full names
        const formattedStudents = students.map(student => ({
            ...student,
            geschlecht: formatGender(student.geschlecht)
        }));

        // Validate students and get available classes in parallel
        const [allErrors, availableClasses] = await Promise.all([
            Promise.resolve(formattedStudents.flatMap((student, index) => validateStudent(student, index))),
            dbAll('SELECT DISTINCT class_name FROM classes')
        ]);

        if (allErrors.length > 0) {
            return handleValidationError(res, allErrors);
        }

        // Validate classes if any are available
        const classNames = availableClasses.map(row => row.class_name);
        if (classNames.length > 0) {
            const classErrors = formattedStudents
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

        // Insert students in batches to handle very large datasets efficiently
        const BATCH_SIZE = 500; // Process 500 students at a time
        let totalInserted = 0;

        for (let i = 0; i < formattedStudents.length; i += BATCH_SIZE) {
            const batch = formattedStudents.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => '(?, ?, ?, ?)').join(', ');
            const values = batch.flatMap(({ vorname, nachname, geschlecht, klasse }) => [
                vorname.trim(),
                nachname.trim(),
                geschlecht || null,
                klasse.trim()
            ]);

            await dbBatchInsert(
                `INSERT INTO students (vorname, nachname, geschlecht, klasse) VALUES ${placeholders}`,
                values
            );
            
            totalInserted += batch.length;
        }

        return handleSuccess(res, { count: totalInserted }, `${totalInserted} Schüler erfolgreich hinzugefügt`);

    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Erstellen der Schüler');
    }
}
