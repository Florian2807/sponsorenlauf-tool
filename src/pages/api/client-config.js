import { getModuleConfig, getSettings } from '../../utils/settingsService.js';
import { handleError, handleMethodNotAllowed, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return handleMethodNotAllowed(res, ['GET']);
    try {
        const [config, settings] = await Promise.all([getModuleConfig(), getSettings(['donation_display_mode', 'setup_completed'])]);
        res.setHeader('Cache-Control', 'no-store');
        return handleSuccess(res, { config, donationMode: settings.donation_display_mode || 'expected', setupCompleted: settings.setup_completed === true });
    } catch (error) { return handleError(res, error, 500, 'Einstellungen konnten nicht geladen werden'); }
}
