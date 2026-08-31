import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';
import { deleteData, DataDeletionError } from '../../utils/dataDeletionService.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return handleMethodNotAllowed(res, ['DELETE']);
    }

    try {
        const types = req.body?.types || req.body?.type;
        const result = await deleteData({
            types,
            confirmation: req.body?.confirmation,
        });

        return handleSuccess(res, result, 'Ausgewählte Daten wurden gelöscht und zuvor gesichert');

    } catch (error) {
        if (error instanceof DataDeletionError) {
            return handleError(res, error, error.status);
        }
        return handleError(res, error, 500, 'Fehler beim Löschen der ausgewählten Daten');
    }
}
