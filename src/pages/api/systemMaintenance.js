import { handleError, handleMethodNotAllowed, handleSuccess } from '../../utils/apiHelpers.js';
import { getSystemConnectivity } from '../../utils/systemMaintenance.js';
import { getMaintenanceStatus, queueMaintenanceAction } from '../../utils/maintenanceService.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const [status, connectivity] = await Promise.all([
                getMaintenanceStatus(),
                getSystemConnectivity(),
            ]);
            return handleSuccess(res, { ...status, connectivity }, 'Systemstatus geladen');
        }
        if (req.method !== 'POST') return handleMethodNotAllowed(res, ['GET', 'POST']);

        const action = req.body?.action;
        const expectedConfirmation = action === 'update' ? 'UPDATE' : action === 'restart' ? 'NEUSTART' : null;
        if (!expectedConfirmation) return handleError(res, new Error('Ungültige Wartungsaktion'), 400);
        if (req.body?.confirmation !== expectedConfirmation) {
            return handleError(res, new Error(`Zur Bestätigung muss exakt „${expectedConfirmation}“ eingegeben werden`), 400);
        }

        const status = await queueMaintenanceAction(action);
        return handleSuccess(res, status, 'Systemaktion wurde sicher eingeplant', 202);
    } catch (error) {
        const statusCode = ['ACTION_IN_PROGRESS', 'MAINTENANCE_UNAVAILABLE'].includes(error.code) ? 409 : 500;
        return handleError(res, error, statusCode, 'Systemaktion konnte nicht eingeplant werden');
    }
}
