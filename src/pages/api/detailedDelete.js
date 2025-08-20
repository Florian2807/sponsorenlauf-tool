import { dbRun, dbGet } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return handleMethodNotAllowed(res, ['DELETE']);
    }

    const { type } = req.body;

    if (!type) {
        return handleError(res, new Error('Löschtyp ist erforderlich'), 400);
    }

    try {
        let result;
        let message = '';

        switch (type) {
            case 'rounds':
                result = await dbRun('DELETE FROM rounds');
                message = `${result.changes} Runden-Datensätze wurden gelöscht`;
                break;

            case 'replacements':
                result = await dbRun('DELETE FROM replacements');
                message = `${result.changes} Ersatz-IDs wurden gelöscht`;
                break;

            case 'expectedDonations':
                result = await dbRun('DELETE FROM expected_donations');
                message = `${result.changes} erwartete Spenden wurden gelöscht`;
                break;

            case 'receivedDonations':
                result = await dbRun('DELETE FROM received_donations');
                message = `${result.changes} erhaltene Spenden wurden gelöscht`;
                break;

            default:
                return handleError(res, new Error('Unbekannter Löschtyp'), 400);
        }

        return handleSuccess(res, {
            deletedCount: result.changes,
            type: type
        }, message);

    } catch (error) {
        return handleError(res, error, 500, `Fehler beim Löschen der ${type}`);
    }
}
