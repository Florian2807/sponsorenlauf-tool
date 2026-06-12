import { dbAll, dbBatchInsert } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import { getAvailableClasses, syncClassNamesFromList } from '../../utils/classService.js';
import { parseImportedStudentId } from '../../utils/studentId.js';

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

    if (student.id !== null && student.id !== undefined && Number.isNaN(student.id)) {
        errors.push(`${linePrefix} Ungültige ID. Erlaubt sind nur positive ganze Zahlen.`);
    }

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
            id: parseImportedStudentId(student.id),
            vorname: student.vorname?.trim() || '',
            nachname: student.nachname?.trim() || '',
            klasse: student.klasse?.trim() || '',
            geschlecht: formatGender(student.geschlecht)
        }));

        // Validate students and get available classes in parallel
        const [allErrors, availableClasses] = await Promise.all([
            Promise.resolve(formattedStudents.flatMap((student, index) => validateStudent(student, index))),
            getAvailableClasses()
        ]);

        if (allErrors.length > 0) {
            return handleValidationError(res, allErrors);
        }

        // Validate classes if any are available
        const classNames = availableClasses;
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

        const importedIds = formattedStudents
            .map(student => student.id)
            .filter(id => Number.isInteger(id));

        const duplicateImportedIds = [...new Set(
            importedIds.filter((id, index) => importedIds.indexOf(id) !== index)
        )];

        if (duplicateImportedIds.length > 0) {
            return handleValidationError(
                res,
                duplicateImportedIds.map(id => `ID ${id} ist im Import mehrfach vorhanden`)
            );
        }

        const existingStudents = await dbAll('SELECT id FROM students');
        const existingIds = new Set(existingStudents.map(student => student.id));
        const conflictingIds = importedIds.filter(id => existingIds.has(id));

        if (conflictingIds.length > 0) {
            return handleValidationError(
                res,
                [...new Set(conflictingIds)].map(id => `ID ${id} ist bereits vergeben`)
            );
        }

        let nextGeneratedId = existingStudents.reduce((maxId, student) => Math.max(maxId, student.id), 0) + 1;
        while (existingIds.has(nextGeneratedId)) {
            nextGeneratedId += 1;
        }

        const studentsToInsert = formattedStudents.map((student) => {
            if (Number.isInteger(student.id)) {
                existingIds.add(student.id);
                return student;
            }

            while (existingIds.has(nextGeneratedId)) {
                nextGeneratedId += 1;
            }

            const assignedId = nextGeneratedId;
            existingIds.add(assignedId);
            nextGeneratedId += 1;

            return {
                ...student,
                id: assignedId
            };
        });

        const autoAssignedCount = studentsToInsert.filter((student, index) => !Number.isInteger(formattedStudents[index].id)).length;

        await syncClassNamesFromList(studentsToInsert.map((student) => student.klasse));

        // Insert students in batches to handle very large datasets efficiently
        const BATCH_SIZE = 500; // Process 500 students at a time
        let totalInserted = 0;

        for (let i = 0; i < studentsToInsert.length; i += BATCH_SIZE) {
            const batch = studentsToInsert.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
            const values = batch.flatMap(({ id, vorname, nachname, geschlecht, klasse }) => [
                id,
                vorname.trim(),
                nachname.trim(),
                geschlecht || null,
                klasse.trim()
            ]);

            await dbBatchInsert(
                `INSERT INTO students (id, vorname, nachname, geschlecht, klasse) VALUES ${placeholders}`,
                values
            );
            
            totalInserted += batch.length;
        }

        const message = autoAssignedCount > 0
            ? `${totalInserted} Schüler erfolgreich hinzugefügt (${autoAssignedCount} IDs automatisch vergeben)`
            : `${totalInserted} Schüler erfolgreich hinzugefügt`;

        return handleSuccess(res, {
            count: totalInserted,
            autoAssignedCount
        }, message);

    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Erstellen der Schüler');
    }
}
