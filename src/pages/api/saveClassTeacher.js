import { assignTeachersToClasses } from '../../utils/teacherService.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return handleMethodNotAllowed(res, ['POST']);
    }

    try {
        const teachers = await assignTeachersToClasses(req.body);
        return handleSuccess(res, { teachers }, 'Klassen-Zuweisungen erfolgreich gespeichert');
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Speichern der Klassen-Zuweisungen');
    }
}