import { dbGet } from '../../utils/database.js';
import {
  handleMethodNotAllowed,
  handleError,
  handleValidationError,
  validateRequiredFields
} from '../../utils/apiHelpers.js';
import { validateStudentId } from '../../utils/validation.js';
import { getModuleConfig } from '../../utils/settingsService.js';
import { recordRound, RoundServiceError } from '../../utils/roundService.js';
import { recordStationHeartbeat } from '../../utils/stationService.js';

const SCAN_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;
const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return handleMethodNotAllowed(res, ['POST']);
  }

  try {
    const missing = validateRequiredFields(req, ['id']);
    if (missing.length > 0) {
      return handleValidationError(res, ['Schüler-ID ist erforderlich']);
    }

    let { id } = req.body;
    const {
      confirmDoubleScan = false,
      scanId = null,
      sourceDeviceId = null
    } = req.body;

    if (!validateStudentId(id)) {
      return handleValidationError(res, ['Ungültige Schüler-ID']);
    }

    if (scanId !== null && (typeof scanId !== 'string' || !SCAN_ID_PATTERN.test(scanId))) {
      return handleValidationError(res, ['Ungültige Scan-ID']);
    }

    if (
      sourceDeviceId !== null
      && (typeof sourceDeviceId !== 'string' || !DEVICE_ID_PATTERN.test(sourceDeviceId))
    ) {
      return handleValidationError(res, ['Ungültige Geräte-ID']);
    }

    if (typeof id === 'string' && id.startsWith('E')) {
      const resolvedId = await resolveReplacementId(id);
      if (!resolvedId) {
        return handleError(res, new Error('Ersatz-ID nicht gefunden'), 404);
      }
      id = resolvedId;
    } else {
      id = Number(id);
    }

    const moduleConfig = await getModuleConfig();
    const result = await recordRound({
      studentId: id,
      confirmDoubleScan: confirmDoubleScan === true,
      doubleScanPrevention: moduleConfig.doubleScanPrevention,
      scanId,
      sourceDeviceId,
    });

    if (sourceDeviceId && result.accepted) {
      await recordStationHeartbeat(sourceDeviceId, { scanned: true });
    }

    if (!result.accepted && result.blocked) {
      return res.status(400).json({
        success: false,
        error: 'DOUBLE_SCAN_BLOCKED',
        message: `Doppel-Scan blockiert. Bitte warten Sie ${result.thresholdMinutes} Minuten zwischen den Scans.`,
        student: result.student,
        lastRoundTime: result.lastRoundTime,
        timeDifferenceMs: result.timeDifferenceMs,
        thresholdMinutes: result.thresholdMinutes
      });
    }

    if (!result.accepted && result.requiresConfirmation) {
      return res.status(200).json({
        success: true,
        requiresConfirmation: true,
        student: result.student,
        lastRoundTime: result.lastRoundTime,
        timeDifferenceMs: result.timeDifferenceMs,
        thresholdMinutes: result.thresholdMinutes,
        message: 'Doppel-Scan erkannt - Bestätigung erforderlich'
      });
    }

    return res.status(200).json({
      success: true,
      requiresConfirmation: false,
      student: result.student,
      round: result.round,
      idempotentReplay: result.idempotentReplay,
      wasDoubleScan: result.wasDoubleScan,
      message: result.idempotentReplay
        ? 'Bereits gespeicherte Runde bestätigt'
        : result.wasDoubleScan
          ? 'Doppel-Scan bestätigt und gezählt'
          : 'Runde erfolgreich gezählt'
    });
  } catch (error) {
    if (error instanceof RoundServiceError) {
      return res.status(error.status).json({
        success: false,
        error: error.code,
        message: error.message,
        ...error.details,
      });
    }

    return handleError(res, error, 500, 'Fehler beim Hinzufügen der Runde');
  }
}

async function resolveReplacementId(replacementId) {
  const numericId = replacementId.substring(1);
  const row = await dbGet(
    'SELECT studentID FROM replacements WHERE id = ?',
    [numericId]
  );
  return row ? row.studentID : null;
}
