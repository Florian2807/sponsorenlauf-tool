import { dbGet, dbRun } from '../../utils/database.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';
import { getSetting, setSetting } from '../../utils/settingsService.js';

export default async function handler(req, res) {
    switch (req.method) {
        case 'GET':
            return await handleGetSetupStatus(req, res);
        case 'POST':
            return await handleCompleteSetup(req, res);
        default:
            return handleMethodNotAllowed(res, ['GET', 'POST']);
    }
}

async function handleGetSetupStatus(req, res) {
    try {
        // Prüfe, ob Setup bereits abgeschlossen wurde
        const isSetupCompleted = await getSetting('setup_completed', false);

        // Zusätzliche Checks für grundlegende Konfiguration
        const classStructure = await getSetting('class_structure', {});
        const hasClassStructure = classStructure && Object.keys(classStructure).length > 0;

        const moduleConfig = await getSetting('module_config', null);
        const hasModuleConfig = moduleConfig !== null;

        return handleSuccess(res, {
            isSetupCompleted,
            hasClassStructure,
            hasModuleConfig,
            shouldShowGuide: !isSetupCompleted
        }, 'Setup-Status erfolgreich abgerufen');

    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Abrufen des Setup-Status');
    }
}

async function handleCompleteSetup(req, res) {
    try {
        // Setze Setup als abgeschlossen
        await setSetting('setup_completed', true);

        // Setze Timestamp für Setup-Abschluss
        await setSetting('setup_completed_at', new Date().toISOString());

        return handleSuccess(res, null, 'Setup erfolgreich abgeschlossen');

    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Abschließen des Setups');
    }
}
