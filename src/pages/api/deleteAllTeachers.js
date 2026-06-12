import { dbRun } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return handleMethodNotAllowed(res, ['DELETE']);
    }

    try {
        const result = await dbRun('DELETE FROM teachers');
        return handleSuccess(res, { amount: result.changes }, 'Alle Lehrerdaten wurden erfolgreich gelöscht');
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Löschen der Lehrerdaten');
    }
}
