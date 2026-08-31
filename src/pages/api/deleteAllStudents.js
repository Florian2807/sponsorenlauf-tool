import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';
import { deleteData, DataDeletionError } from '../../utils/dataDeletionService.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return handleMethodNotAllowed(res, ['DELETE']);
    }

    try {
        const result = await deleteData({
            types: ['students'],
            confirmation: req.body?.confirmation,
        });
        return handleSuccess(res, {
            amount: result.deletedCounts.students,
            backupFilename: result.backupFilename,
        }, 'Alle Schülerdaten wurden gesichert und erfolgreich gelöscht');
    } catch (error) {
        if (error instanceof DataDeletionError) {
            return handleError(res, error, error.status);
        }
        return handleError(res, error, 500, 'Fehler beim Löschen der Schülerdaten');
    }
}
