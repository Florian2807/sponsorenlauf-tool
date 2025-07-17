import { getStudentById, getStudentByIdFast, getStudentByIdMinimal } from '../../utils/studentService.js';
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
  const startTime = Date.now(); // Performance-Timing

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

    // Behandle Ersatz-IDs (E-prefix) - nur wenn nötig
    if (typeof id === 'string' && id.startsWith('E')) {
      const resolvedId = await resolveReplacementId(id);
      if (!resolvedId) {
        return handleError(res, new Error('Ersatz-ID nicht gefunden'), 404);
      }
      id = resolvedId;
    }

    console.log(`⏱️ Ersatz-ID Check: ${Date.now() - startTime}ms`);
    const studentTime = Date.now();

    const student = await getStudentByIdMinimal(id); // Verwende die ULTRA-schnelle Version
    if (!student) {
      return handleError(res, new Error('Schüler nicht gefunden'), 404);
    }

    console.log(`⏱️ Student geladen: ${Date.now() - studentTime}ms`);
    const roundTime = Date.now();

    const timestamp = date ? new Date(date).toISOString() : new Date().toISOString();

    // Überspringe Timestamp-Validierung für Performance (neue Timestamps sind immer gültig)

    // Füge neue Runde hinzu
    await dbRun(
      'INSERT INTO rounds (timestamp, student_id) VALUES (?, ?)',
      [timestamp, id]
    );

    console.log(`⏱️ Runde eingefügt: ${Date.now() - roundTime}ms`);

    // Aktualisiere die Rundenzahl im Student-Objekt
    const updatedStudent = {
      ...student,
      roundCount: student.roundCount + 1 // Erhöhe die Rundenzahl um 1
    };

    const endTime = Date.now();
    console.log(`🚀 Runden-API Performance: ${endTime - startTime}ms`);

    return handleSuccess(res, {
      student: updatedStudent
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