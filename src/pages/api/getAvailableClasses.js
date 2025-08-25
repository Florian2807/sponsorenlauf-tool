import { getAvailableClasses } from '../../utils/classService.js';
import { createSimpleGetHandler } from '../../utils/apiHelpers.js';

export default createSimpleGetHandler(
    getAvailableClasses,
    'Verfügbare Klassen erfolgreich abgerufen',
    'Fehler beim Abrufen der verfügbaren Klassen'
);
