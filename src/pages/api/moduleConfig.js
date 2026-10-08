import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { getModuleConfig, setSetting } from '../../utils/settingsService.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const moduleConfig = await getModuleConfig();

      res.status(200).json(moduleConfig);
    } else if (req.method === 'POST') {
      const { donations, emails, teachers, doubleScanPrevention, roundDisplay } = req.body;

      // Validiere die Basismodule
      if (typeof donations !== 'boolean' || typeof emails !== 'boolean' || typeof teachers !== 'boolean') {
        return res.status(400).json({
          error: 'donations, emails und teachers müssen boolean-Werte sein'
        });
      }

      if (roundDisplay !== undefined && typeof roundDisplay !== 'boolean') {
        return res.status(400).json({ error: 'roundDisplay muss ein boolean-Wert sein' });
      }

      // Validiere doubleScanPrevention
      if (doubleScanPrevention !== undefined) {
        if (!doubleScanPrevention || typeof doubleScanPrevention !== 'object') {
          return res.status(400).json({ error: 'doubleScanPrevention muss eine Konfiguration sein' });
        }
        if (typeof doubleScanPrevention.enabled !== 'boolean') {
          return res.status(400).json({
            error: 'doubleScanPrevention.enabled muss ein boolean-Wert sein'
          });
        }
        if (!Number.isInteger(doubleScanPrevention.timeThresholdMinutes) ||
            doubleScanPrevention.timeThresholdMinutes < 1 ||
            doubleScanPrevention.timeThresholdMinutes > 60) {
          return res.status(400).json({
            error: 'doubleScanPrevention.timeThresholdMinutes muss eine ganze Zahl zwischen 1 und 60 sein'
          });
        }
        if (!['confirm', 'block'].includes(doubleScanPrevention.mode)) {
          return res.status(400).json({
            error: 'doubleScanPrevention.mode muss "confirm" oder "block" sein'
          });
        }
      }

      const currentConfig = await getModuleConfig();
      const moduleConfig = { donations, emails, teachers,
        doubleScanPrevention: doubleScanPrevention ?? currentConfig.doubleScanPrevention,
        roundDisplay: roundDisplay ?? currentConfig.roundDisplay };
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
