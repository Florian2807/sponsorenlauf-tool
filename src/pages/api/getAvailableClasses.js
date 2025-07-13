import { getAvailableClasses } from '../../utils/classService.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return handleMethodNotAllowed(res, ['GET']);
    }

    try {
        const classes = await getAvailableClasses();
        return handleSuccess(res, classes, 'Verfügbare Klassen erfolgreich abgerufen');
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Abrufen der verfügbaren Klassen');
    }
}
