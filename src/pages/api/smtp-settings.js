import { handleError, handleMethodNotAllowed, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import {
    getSmtpConfiguration,
    saveSmtpConfiguration,
    testSmtpConfiguration,
} from '../../utils/smtpService.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const configuration = await getSmtpConfiguration();
            return handleSuccess(res, { configured: Boolean(configuration), configuration }, 'E-Mail-Konfiguration geladen');
        }
        if (req.method === 'PUT') {
            const configuration = await saveSmtpConfiguration(req.body || {});
            return handleSuccess(res, { configured: true, configuration }, 'E-Mail-Konfiguration gespeichert');
        }
        if (req.method === 'POST') {
            await testSmtpConfiguration(req.body || {});
            return handleSuccess(res, { connected: true }, 'E-Mail-Versand erfolgreich getestet');
        }
        return handleMethodNotAllowed(res, ['GET', 'PUT', 'POST']);
    } catch (error) {
        if (error.validationErrors) return handleValidationError(res, error.validationErrors);
        return handleError(res, error, 400, `E-Mail-Verbindung fehlgeschlagen: ${error.message}`);
    }
}
