import { dbAll, dbBatchInsert } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';

function validateTeacher(teacher, index) {
    const errors = [];
    const linePrefix = `Zeile ${index + 1}:`;

    if (!teacher.vorname?.trim()) errors.push(`${linePrefix} Vorname ist erforderlich`);
    if (!teacher.nachname?.trim()) errors.push(`${linePrefix} Nachname ist erforderlich`);
    if (!teacher.email?.trim()) errors.push(`${linePrefix} E-Mail ist erforderlich`);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (teacher.email?.trim() && !emailRegex.test(teacher.email.trim())) {
        errors.push(`${linePrefix} Ungültige E-Mail-Adresse "${teacher.email}"`);
    }

    return errors;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return handleMethodNotAllowed(res, ['POST']);
    }

    try {
        const { teachers } = req.body;

        if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
            return handleValidationError(res, ['Keine Lehrerdaten empfangen']);
        }

        // Validate teachers and get existing teachers and available classes in parallel
        const [allErrors, existingTeachers, availableClasses] = await Promise.all([
            Promise.resolve(teachers.flatMap((teacher, index) => validateTeacher(teacher, index))),
            dbAll('SELECT id, email FROM teachers'),
            dbAll('SELECT DISTINCT class_name FROM classes')
        ]);

        if (allErrors.length > 0) {
            return handleValidationError(res, allErrors);
        }

        // Check for duplicate emails
        const existingEmails = existingTeachers.map(t => t.email.toLowerCase());
        const emailErrors = [];

        teachers.forEach((teacher, index) => {
            const email = teacher.email.trim().toLowerCase();
            if (existingEmails.includes(email)) {
                emailErrors.push(`Zeile ${index + 1}: E-Mail "${teacher.email}" ist bereits vergeben`);
            }
        });

        if (emailErrors.length > 0) {
            return handleValidationError(res, emailErrors);
        }

        // Validate classes if any are available and teacher has a class assigned
        const classNames = availableClasses.map(row => row.class_name);
        if (classNames.length > 0) {
            const classErrors = teachers
                .filter(teacher => teacher.klasse && teacher.klasse.trim()) // Only check if class is provided
                .map((teacher, index) =>
                    !classNames.includes(teacher.klasse.trim())
                        ? `Zeile ${index + 1}: Ungültige Klasse "${teacher.klasse}". Verfügbare Klassen: ${classNames.join(', ')}`
                        : null
                )
                .filter(Boolean);

            if (classErrors.length > 0) {
                return handleValidationError(res, classErrors);
            }
        }

        // Get next available ID for teachers without ID
        const getNextId = async () => {
            const result = await dbAll('SELECT MAX(id) as maxId FROM teachers');
            return (result[0]?.maxId || 0) + 1;
        };

        let nextId = await getNextId();

        // Insert teachers in batches with automatically assigned IDs
        const BATCH_SIZE = 500; // Process 500 teachers at a time
        let totalInserted = 0;

        for (let i = 0; i < teachers.length; i += BATCH_SIZE) {
            const batch = teachers.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
            const values = batch.flatMap((teacher) => [
                nextId++,
                teacher.vorname.trim(),
                teacher.nachname.trim(),
                teacher.klasse?.trim() || null,
                teacher.email.trim()
            ]);

            await dbBatchInsert(
                `INSERT INTO teachers (id, vorname, nachname, klasse, email) VALUES ${placeholders}`,
                values
            );
            
            totalInserted += batch.length;
        }

        return handleSuccess(res, { count: totalInserted }, `${totalInserted} Lehrer erfolgreich hinzugefügt`);

    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Erstellen der Lehrer');
    }
}
