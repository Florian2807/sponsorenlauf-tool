import { getClasses } from '../../utils/classService.js';
import { createSimpleGetHandler } from '../../utils/apiHelpers.js';

export default createSimpleGetHandler(
    getClasses,
    'Klassen erfolgreich abgerufen',
    'Fehler beim Abrufen der Klassen'
);