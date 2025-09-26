import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';
import { getSetting, setSetting } from '../../utils/settingsService.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const moduleConfig = await getSetting('module_config', {
        donations: true,
        emails: true,
        teachers: true,
        doubleScanPrevention: {
          enabled: true,
          timeThresholdMinutes: 5,
          mode: 'confirm' // 'confirm' oder 'block'
        }
      });

      res.status(200).json(moduleConfig);
    } else if (req.method === 'POST') {
      const { donations, emails, teachers, doubleScanPrevention } = req.body;

      // Validiere die Basismodule
      if (typeof donations !== 'boolean' || typeof emails !== 'boolean' || typeof teachers !== 'boolean') {
        return res.status(400).json({
          error: 'donations, emails und teachers müssen boolean-Werte sein'
        });
      }

      // Validiere doubleScanPrevention
      if (doubleScanPrevention) {
        if (typeof doubleScanPrevention.enabled !== 'boolean') {
          return res.status(400).json({
            error: 'doubleScanPrevention.enabled muss ein boolean-Wert sein'
          });
        }
        if (typeof doubleScanPrevention.timeThresholdMinutes !== 'number' || 
            doubleScanPrevention.timeThresholdMinutes < 1 || 
            doubleScanPrevention.timeThresholdMinutes > 60) {
          return res.status(400).json({
            error: 'doubleScanPrevention.timeThresholdMinutes muss eine Zahl zwischen 1 und 60 sein'
          });
        }
        if (!['confirm', 'block'].includes(doubleScanPrevention.mode)) {
          return res.status(400).json({
            error: 'doubleScanPrevention.mode muss "confirm" oder "block" sein'
          });
        }
      }

      const moduleConfig = { donations, emails, teachers, doubleScanPrevention };
      await setSetting('module_config', moduleConfig);

      res.status(200).json({
        success: true,
        message: 'Modul-Konfiguration erfolgreich gespeichert',
        modules: moduleConfig
      });
    } else {
      return handleMethodNotAllowed(res, ['GET', 'POST']);
    }
  } catch (error) {
    console.error('Fehler in moduleConfig API:', error);
    return handleError(res, error, 500, 'Fehler beim Verarbeiten der Modul-Konfiguration');
  }
}
