import { getStudentDirectory } from '../../utils/studentSummaryService.js';
import { handleSuccess, handleError, handleMethodNotAllowed } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return handleMethodNotAllowed(res, ['GET']);
  try { return handleSuccess(res, await getStudentDirectory(req.query), 'Schüler erfolgreich abgerufen'); }
  catch (error) { return handleError(res, error, 500, 'Fehler beim Abrufen der Schülerdaten'); }
}
