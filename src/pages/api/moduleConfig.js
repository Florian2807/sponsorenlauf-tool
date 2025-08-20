import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';
import { getSetting, setSetting } from '../../utils/settingsService.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const moduleConfig = await getSetting('module_config', { 
        donations: true, 
        emails: true, 
        teachers: true 
      });
      
      res.status(200).json(moduleConfig);
    } else if (req.method === 'POST') {
      const { donations, emails, teachers } = req.body;
      
      if (typeof donations !== 'boolean' || typeof emails !== 'boolean' || typeof teachers !== 'boolean') {
        return res.status(400).json({ 
          error: 'donations, emails und teachers müssen boolean-Werte sein' 
        });
      }
      
      const moduleConfig = { donations, emails, teachers };
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
