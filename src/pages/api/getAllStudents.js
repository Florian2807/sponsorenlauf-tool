import { getAllStudents } from '../../utils/studentService.js';
import { createSimpleGetHandler } from '../../utils/apiHelpers.js';

export default createSimpleGetHandler(
  getAllStudents,
  'Schüler erfolgreich abgerufen',
  'Fehler beim Abrufen der Schülerdaten'
);