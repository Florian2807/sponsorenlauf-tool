import { getRoundsByStudentId } from '../../../../utils/studentService.js';
import {
  handleMethodNotAllowed,
  handleError,
  handleSuccess,
  handleValidationError,
  validateRequiredFields
} from '../../../../utils/apiHelpers.js';
import { validateStudentId } from '../../../../utils/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const { id } = req.query;

    if (!id || !validateStudentId(id)) {
      return handleValidationError(res, ['Gültige Schüler-ID ist erforderlich']);
    }

    // Behandle Ersatz-IDs (E-prefix)
    let studentId = id;
    if (typeof id === 'string' && id.startsWith('E')) {
      studentId = await resolveReplacementId(id);
      if (!studentId) {
        return handleError(res, new Error('Ersatz-ID nicht gefunden'), 404);
      }
    }

    const timestamps = await getRoundsByStudentId(studentId);

    return handleSuccess(res, { timestamps }, 'Timestamps erfolgreich geladen');
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Laden der Timestamps');
  }
}

/**
 * Löst eine Ersatz-ID zur entsprechenden Schüler-ID auf
 * @param {string} replacementId Ersatz-ID (z.B. "E1")
 * @returns {Promise<number|null>} Schüler-ID oder null
 */
async function resolveReplacementId(replacementId) {
  const { dbGet } = await import('../../../../utils/database.js');
  const numericId = replacementId.replace('E', '');
  const row = await dbGet(
    'SELECT studentID FROM replacements WHERE id = ?',
    [numericId]
  );
  return row ? row.studentID : null;
}
