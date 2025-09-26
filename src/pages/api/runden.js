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
import { getSetting } from '../../utils/settingsService.js';

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

    // Behandle Ersatz-IDs (E-prefix) - nur wenn nötig
    if (typeof id === 'string' && id.startsWith('E')) {
      const resolvedId = await resolveReplacementId(id);
      if (!resolvedId) {
        return handleError(res, new Error('Ersatz-ID nicht gefunden'), 404);
      }
      id = resolvedId;
    }

    const student = await getStudentByIdMinimal(id); // Verwende die ULTRA-schnelle Version
    if (!student) {
      return handleError(res, new Error('Schüler nicht gefunden'), 404);
    }
    const timestamp = date ? new Date(date).toISOString() : new Date().toISOString();

    // Lade Doppel-Scan-Konfiguration
    const moduleConfig = await getSetting('module_config', { 
      doubleScanPrevention: {
        enabled: true,
        timeThresholdMinutes: 5,
        mode: 'confirm'
      }
    });

    // Prüfe IMMER auf Doppel-Scan (unabhängig von Einstellungen)
    const lastRound = await getLastRoundByStudentId(id);
    let isDoubleScan = false;
    let lastRoundTime = null;
    let timeDiff = 0;

    if (lastRound) {
      timeDiff = Date.now() - new Date(lastRound.timestamp).getTime();
      const thresholdMs = moduleConfig.doubleScanPrevention.timeThresholdMinutes * 60 * 1000;
      
      if (timeDiff < thresholdMs) {
        isDoubleScan = true;
        lastRoundTime = lastRound.timestamp;
      }
    }

    // ENTSCHEIDUNG: Was passiert bei Doppel-Scan?
    const { confirmDoubleScan } = req.body;
    
    if (isDoubleScan && moduleConfig.doubleScanPrevention.enabled && !confirmDoubleScan) {
      if (moduleConfig.doubleScanPrevention.mode === 'block') {
        // Block-Modus: Scan wird komplett abgelehnt
        return res.status(400).json({
          success: false,
          error: 'DOUBLE_SCAN_BLOCKED',
          message: `Doppel-Scan blockiert. Bitte warten Sie ${moduleConfig.doubleScanPrevention.timeThresholdMinutes} Minuten zwischen den Scans.`,
          student: student,
          lastRoundTime: lastRoundTime,
          timeDifferenceMs: timeDiff,
          thresholdMinutes: moduleConfig.doubleScanPrevention.timeThresholdMinutes
        });
      } else {
        // Confirm-Modus: Bestätigung erforderlich
        return res.status(200).json({
          success: true,
          requiresConfirmation: true,
          student: student,
          lastRoundTime: lastRoundTime,
          timeDifferenceMs: timeDiff,
          thresholdMinutes: moduleConfig.doubleScanPrevention.timeThresholdMinutes,
          message: 'Doppel-Scan erkannt - Bestätigung erforderlich'
        });
      }
    }

    // HIER: Runde hinzufügen (entweder kein Doppel-Scan ODER bestätigt ODER Schutz deaktiviert)
    await dbRun(
      'INSERT INTO rounds (timestamp, student_id) VALUES (?, ?)',
      [timestamp, id]
    );

    // Aktualisierte Schülerdaten
    const updatedStudent = {
      ...student,
      roundCount: student.roundCount + 1
    };

    // Erfolgreich gespeichert - mit Info ob es ein bestätigter Doppel-Scan war
    return res.status(200).json({
      success: true,
      requiresConfirmation: false,
      student: updatedStudent,
      wasDoubleScan: isDoubleScan,
      message: isDoubleScan ? 'Doppel-Scan bestätigt und gezählt' : 'Runde erfolgreich gezählt'
    });
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

/**
 * Hilfsfunktion um die letzte Runde eines Schülers zu holen
 * @param {number} studentId Schüler-ID
 * @returns {Promise<Object|null>} Letzte Runde oder null
 */
async function getLastRoundByStudentId(studentId) {
  const row = await dbGet(
    'SELECT timestamp FROM rounds WHERE student_id = ? ORDER BY timestamp DESC LIMIT 1',
    [studentId]
  );
  return row;
}