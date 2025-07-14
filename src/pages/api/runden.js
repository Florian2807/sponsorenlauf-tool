import { getStudentById } from '../../utils/studentService.js';
import { dbGet, dbRun, dbAll } from '../../utils/database.js';
import {
  handleMethodNotAllowed,
  handleError,
  handleSuccess,
  handleValidationError,
  validateRequiredFields
} from '../../utils/apiHelpers.js';
import { validateStudentId, validateTimestamp } from '../../utils/validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return handleMethodNotAllowed(res, ['POST']);
  }

  try {
    const missing = validateRequiredFields(req, ['id']);
    if (missing.length > 0) {
      return handleValidationError(res, ['Schüler-ID ist erforderlich']);
    }

    let { id, date } = req.body;

    if (!validateStudentId(id)) {
      return handleValidationError(res, ['Ungültige Schüler-ID']);
    }

    // Behandle Ersatz-IDs (E-prefix)
    if (typeof id === 'string' && id.startsWith('E')) {
      id = await resolveReplacementId(id);
      if (!id) {
        return handleError(res, new Error('Ersatz-ID nicht gefunden'), 404);
      }
    }

    const student = await getStudentById(id);
    if (!student) {
      return handleError(res, new Error('Schüler nicht gefunden'), 404);
    }

    const timestamp = date ? new Date(date).toISOString() : new Date().toISOString();

    if (!validateTimestamp(timestamp)) {
      return handleValidationError(res, ['Ungültiger Zeitstempel']);
    }

    // Füge neue Runde hinzu
    await dbRun(
      'INSERT INTO rounds (timestamp, student_id) VALUES (?, ?)',
      [timestamp, id]
    );

    // Lade alle Runden für diesen Studenten
    const timestamps = await getRoundsByStudentId(id);

    // Erweitere die Antwort um vollständige Schülerdaten für bessere Performance
    const fullStudentData = {
      ...student,
      timestamps
    };

    return handleSuccess(res, { 
      student: fullStudentData
    }, 'Runde erfolgreich gezählt');
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Hinzufügen der Runde');
  }
}

/**
 * Löst eine Ersatz-ID zur entsprechenden Schüler-ID auf
 * @param {string} replacementId Ersatz-ID (z.B. "E1")
 * @returns {Promise<number|null>} Schüler-ID oder null
 */
async function resolveReplacementId(replacementId) {
  const numericId = replacementId.replace('E', '');
  const row = await dbGet(
    'SELECT studentID FROM replacements WHERE id = ?',
    [numericId]
  );
  return row ? row.studentID : null;
}

/**
 * Hilfsfunktion um Runden für einen Schüler zu laden
 * @param {number} studentId Schüler-ID
 * @returns {Promise<Array>} Array von Zeitstempeln
 */
async function getRoundsByStudentId(studentId) {
  const rows = await dbAll(
    'SELECT timestamp FROM rounds WHERE student_id = ? ORDER BY timestamp DESC',
    [studentId]
  );
  return rows.map(row => row.timestamp);
}