import { handleError, handleMethodNotAllowed, handleSuccess } from '../../utils/apiHelpers.js';
import { getSystemConnectivity } from '../../utils/systemMaintenance.js';
import { getMaintenanceLogs, getMaintenanceStatus, queueMaintenanceAction } from '../../utils/maintenanceService.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const [status, connectivity, logs] = await Promise.all([
                getMaintenanceStatus(),
                getSystemConnectivity(),
                getMaintenanceLogs(),
            ]);
            return handleSuccess(res, { ...status, connectivity, logs }, 'Systemstatus geladen');
        }
        if (req.method !== 'POST') return handleMethodNotAllowed(res, ['GET', 'POST']);

        const action = req.body?.action;
        const expectedConfirmation = action === 'update' ? 'UPDATE' : action === 'restart' ? 'NEUSTART' : null;
        if (!expectedConfirmation) return handleError(res, new Error('Ungültige Wartungsaktion'), 400);
        if (req.body?.confirmation !== expectedConfirmation) {
            return handleError(res, new Error(`Zur Bestätigung muss exakt „${expectedConfirmation}“ eingegeben werden`), 400);
        }

        if (action === 'update') {
            const connectivity = await getSystemConnectivity();
            if (!connectivity.internetConnected) {
                const error = new Error('Update nicht möglich: Es wurde keine Internetverbindung erkannt');
                error.code = 'NO_INTERNET';
                throw error;
            }
        }

        const status = await queueMaintenanceAction(action);
        return handleSuccess(res, status, 'Systemaktion wurde sicher eingeplant', 202);
    } catch (error) {
        const statusCodes = { ACTION_IN_PROGRESS: 409, MAINTENANCE_UNAVAILABLE: 503, NO_INTERNET: 503, EACCES: 503, EPERM: 503, ENOSPC: 507 };
        const statusCode = statusCodes[error.code] || 500;
        const genericMessage = req.method === 'GET'
            ? 'Systemstatus konnte nicht geladen werden'
            : 'Systemaktion konnte nicht eingeplant werden';
        return handleError(res, error, statusCode, statusCode === 500 ? genericMessage : null);
    }
}
