import { deleteRoundById } from '../../../utils/studentService.js';
import {
  handleError,
  handleMethodNotAllowed,
  handleSuccess,
  handleValidationError,
} from '../../../utils/apiHelpers.js';
import { validateStudentId } from '../../../utils/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return handleMethodNotAllowed(res, ['DELETE']);
  }

  const rawRoundId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const roundId = Number(rawRoundId);
  const { studentId } = req.body || {};

  if (!Number.isInteger(roundId) || roundId <= 0) {
    return handleValidationError(res, ['Gültige Runden-ID ist erforderlich']);
  }

  if (!validateStudentId(studentId)) {
    return handleValidationError(res, ['Gültige Schüler-ID ist erforderlich']);
  }

  try {
    const result = await deleteRoundById(roundId, Number(studentId));
    if (result.changes === 0) {
      return handleError(res, new Error('Runde nicht gefunden'), 404);
    }

    return handleSuccess(res, { deletedRoundId: roundId }, 'Runde erfolgreich gelöscht');
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Löschen der Runde');
  }
}
