import { getAllStudents } from '../../utils/studentService.js';
import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const students = await getAllStudents();
    return handleSuccess(res, students, 'Schüler erfolgreich abgerufen');
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Abrufen der Schülerdaten');
  }
}