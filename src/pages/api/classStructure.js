import {
    getClassStructure,
    updateClassStructure
} from '../../utils/classService.js';
import {
    handleMethodNotAllowed,
    handleError,
    handleSuccess,
    handleValidationError
} from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    try {
        switch (req.method) {
            case 'GET':
                return await handleGetClassStructure(res);

            case 'PUT':
                return await handleUpdateClassStructure(res, req.body);

            default:
                return handleMethodNotAllowed(res, ['GET', 'PUT']);
        }
    } catch (error) {
        return handleError(res, error, 500, 'Fehler bei der Klassenstruktur-Verarbeitung');
    }
}

async function handleGetClassStructure(res) {
    const structure = await getClassStructure();
    return handleSuccess(res, structure, 'Klassenstruktur erfolgreich abgerufen');
}

async function handleUpdateClassStructure(res, body) {
    const { availableClasses } = body;

    if (!availableClasses || typeof availableClasses !== 'object') {
        return handleValidationError(res, ['Ungültige Klassenstruktur']);
    }

    const result = await updateClassStructure(availableClasses);
    return handleSuccess(res, result, 'Klassenstruktur erfolgreich aktualisiert');
}
