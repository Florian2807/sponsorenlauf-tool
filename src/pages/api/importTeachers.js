import { dbAll, dbBatchInsert } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import { getAvailableClasses, resolveCanonicalClassName, syncClassNamesFromList } from '../../utils/classService.js';

function validateTeacher(teacher, index) {
    const errors = [];
    const linePrefix = `Zeile ${index + 1}:`;

    if (!teacher.vorname?.trim()) errors.push(`${linePrefix} Vorname ist erforderlich`);
    if (!teacher.nachname?.trim()) errors.push(`${linePrefix} Nachname ist erforderlich`);
    if (!teacher.email?.trim()) errors.push(`${linePrefix} E-Mail ist erforderlich`);
    if (teacher.vorname?.length > 200) errors.push(`${linePrefix} Vorname ist zu lang`);
    if (teacher.nachname?.length > 200) errors.push(`${linePrefix} Nachname ist zu lang`);
    if (teacher.klasse?.length > 100) errors.push(`${linePrefix} Klassenname ist zu lang`);
    if (teacher.email?.length > 320) errors.push(`${linePrefix} E-Mail-Adresse ist zu lang`);
    
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
            klasse: String(teacher.klasse || '').trim(),
            email: teacher.email?.trim() || ''
        }));

        // Validate teachers and load available classes in parallel. E-mail addresses
        // intentionally do not have to be unique: one mailbox may belong to several teachers.
        const [allErrors, availableClasses] = await Promise.all([
            Promise.resolve(normalizedTeachers.flatMap((teacher, index) => validateTeacher(teacher, index))),
            getAvailableClasses()
        ]);

        if (allErrors.length > 0) {
            return handleValidationError(res, allErrors);
        }

        const classNames = availableClasses;
        const teachersWithResolvedClasses = normalizedTeachers.map((teacher) => ({
            ...teacher,
            klasse: resolveCanonicalClassName(teacher.klasse, classNames),
        }));

        if (classNames.length > 0) {
            const classErrors = teachersWithResolvedClasses
                .map((teacher, index) => (
                    teacher.klasse && !classNames.includes(teacher.klasse)
                        ? `Zeile ${index + 1}: Ungültige Klasse "${normalizedTeachers[index].klasse}". Verfügbare Klassen: ${classNames.join(', ')}`
                        : null
                ))
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

        await syncClassNamesFromList(teachersWithResolvedClasses.map((teacher) => teacher.klasse).filter(Boolean));

        // Insert teachers in batches with automatically assigned IDs
        const BATCH_SIZE = 500; // Process 500 teachers at a time
        let totalInserted = 0;

        for (let i = 0; i < teachersWithResolvedClasses.length; i += BATCH_SIZE) {
            const batch = teachersWithResolvedClasses.slice(i, i + BATCH_SIZE);
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
