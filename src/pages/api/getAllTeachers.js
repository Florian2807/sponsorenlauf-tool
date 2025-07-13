import { getAllTeachers } from '../../utils/teacherService.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return handleMethodNotAllowed(res, ['GET']);
    }

    try {
        const teachers = await getAllTeachers();
        return handleSuccess(res, teachers, 'Lehrer erfolgreich abgerufen');
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Abrufen der Lehrerdaten');
    }
}