import { handleError, handleMethodNotAllowed, handleSuccess } from '../../../utils/apiHelpers.js';
import { recordStationHeartbeat, STATION_ID_PATTERN } from '../../../utils/stationService.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return handleMethodNotAllowed(res, ['POST']);
    const deviceId = req.body?.deviceId;
    if (!STATION_ID_PATTERN.test(String(deviceId || ''))) {
        return handleError(res, new Error('Ungültige Stations-ID'), 400);
    }
    try {
        await recordStationHeartbeat(deviceId);
        return handleSuccess(res, { recordedAt: new Date().toISOString() }, 'Station aktiv');
    } catch (error) {
        return handleError(res, error, 500, 'Stationsstatus konnte nicht gespeichert werden');
    }
}
