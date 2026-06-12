import { dbAll, dbBatchInsert } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import { getAvailableClasses, syncClassNamesFromList } from '../../utils/classService.js';

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

        const normalizedTeachers = teachers.map((teacher) => ({
            ...teacher,
            vorname: teacher.vorname?.trim() || '',
            nachname: teacher.nachname?.trim() || '',
            klasse: teacher.klasse?.trim() || '',
            email: teacher.email?.trim() || ''
        }));

        // Validate teachers and get existing teachers and available classes in parallel
        const [allErrors, existingTeachers, availableClasses] = await Promise.all([
            Promise.resolve(normalizedTeachers.flatMap((teacher, index) => validateTeacher(teacher, index))),
            dbAll('SELECT id, email FROM teachers'),
            getAvailableClasses()
        ]);

        if (allErrors.length > 0) {
            return handleValidationError(res, allErrors);
        }

        // Check for duplicate emails
        const existingEmails = existingTeachers.map(t => t.email.toLowerCase());
        const importedEmails = normalizedTeachers.map(teacher => teacher.email.toLowerCase());
        const emailErrors = [];

        normalizedTeachers.forEach((teacher, index) => {
            const email = teacher.email.toLowerCase();
            if (existingEmails.includes(email)) {
                emailErrors.push(`Zeile ${index + 1}: E-Mail "${teacher.email}" ist bereits vergeben`);
            }

            if (importedEmails.indexOf(email) !== index) {
                emailErrors.push(`Zeile ${index + 1}: E-Mail "${teacher.email}" ist im Import mehrfach vorhanden`);
            }
        });

        if (emailErrors.length > 0) {
            return handleValidationError(res, [...new Set(emailErrors)]);
        }

        // Validate classes if any are available and teacher has a class assigned
        const classNames = availableClasses;
        if (classNames.length > 0) {
            const classErrors = normalizedTeachers
                .map((teacher, index) =>
                    teacher.klasse && !classNames.includes(teacher.klasse)
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

        await syncClassNamesFromList(normalizedTeachers.map((teacher) => teacher.klasse).filter(Boolean));

        // Insert teachers in batches with automatically assigned IDs
        const BATCH_SIZE = 500; // Process 500 teachers at a time
        let totalInserted = 0;

        for (let i = 0; i < normalizedTeachers.length; i += BATCH_SIZE) {
            const batch = normalizedTeachers.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
            const values = batch.flatMap((teacher) => [
                nextId++,
                teacher.vorname,
                teacher.nachname,
                teacher.klasse || null,
                teacher.email
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
