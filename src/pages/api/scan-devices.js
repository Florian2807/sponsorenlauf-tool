import { getScanDevices, renameScanDevice } from '../../utils/scanDeviceService.js';
import { isScanDeviceId } from '../../utils/scanFeedService.js';
import { handleError, handleMethodNotAllowed } from '../../utils/apiHelpers.js';
import { createHash } from 'node:crypto';

export default async function handler(req, res) {
    if (!['GET', 'PUT'].includes(req.method)) return handleMethodNotAllowed(res, ['GET', 'PUT']);
    res.setHeader('Cache-Control', 'no-store');
    try {
        if (req.method === 'GET') {
            const selected = req.query.selected;
            if (selected !== undefined && !isScanDeviceId(selected)) return res.status(400).json({ message: 'Ungültige Geräte-ID' });
            const payload = { devices: await getScanDevices(selected) };
            const tag = `"${createHash('sha256').update(JSON.stringify(payload)).digest('base64url')}"`;
            res.setHeader('Cache-Control', 'private, no-cache');
            res.setHeader('ETag', tag);
            if (req.headers?.['if-none-match'] === tag) return res.status(304).end();
            return res.status(200).json(payload);
        }
        const { deviceId, name } = req.body || {};
        if (!isScanDeviceId(deviceId) || typeof name !== 'string' || !name.trim() || name.trim().length > 60) {
            return res.status(400).json({ message: 'Bitte einen Scanner-Namen mit 1 bis 60 Zeichen eingeben.' });
        }
        const device = await renameScanDevice(deviceId, name.trim());
        if (!device) return res.status(404).json({ message: 'Scanner nicht gefunden.' });
        return res.status(200).json({ device });
    } catch (error) { return handleError(res, error, 500, 'Scanner konnten nicht geladen werden'); }
}
