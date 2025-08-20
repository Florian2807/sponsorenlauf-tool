import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { getSetting, setSetting } from '../../utils/settingsService.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return handleMethodNotAllowed(res, ['GET', 'POST']);
  }

  try {
    if (req.method === 'GET') {
      // Standard: erwartete Spenden anzeigen
      const donationDisplayMode = await getSetting('donation_display_mode', 'expected');
      
      res.status(200).json({ donationDisplayMode });
    } else if (req.method === 'POST') {
      const { donationDisplayMode } = req.body;
      
      if (!['expected', 'received'].includes(donationDisplayMode)) {
        return res.status(400).json({ 
          error: 'donationDisplayMode muss "expected" oder "received" sein' 
        });
      }
      
      await setSetting('donation_display_mode', donationDisplayMode);
      
      res.status(200).json({ 
        message: 'Spenden-Anzeigemodus erfolgreich gespeichert',
        donationDisplayMode 
      });
    }
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Verwalten der Spenden-Einstellungen');
  }
}
