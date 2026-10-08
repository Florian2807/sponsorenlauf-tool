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
  if (!['POST', 'GET'].includes(req.method)) {
    return handleMethodNotAllowed(res, ['POST', 'GET']);
  }

  try {
    if (req.method === 'GET') {
      const { scanId } = req.query;
      if (typeof scanId !== 'string' || !SCAN_ID_PATTERN.test(scanId)) {
        return handleValidationError(res, ['Ungültige Scan-ID']);
      }
      res.setHeader('Cache-Control', 'no-store');
      const row = await dbGet(`SELECT r.id, r.timestamp, r.source_station_id, r.source_station_name, r.station_warning, s.id AS studentId,
        s.vorname, s.nachname, s.klasse,
        (SELECT COUNT(*) FROM rounds WHERE student_id = s.id) AS roundCount,
        (SELECT timestamp FROM rounds WHERE student_id = s.id AND id < r.id ORDER BY id DESC LIMIT 1) AS previousTimestamp
        FROM rounds r JOIN students s ON s.id = r.student_id WHERE r.scan_id = ?`, [scanId]);
      return res.status(200).json(row ? {
        success: true, stored: true, scanId,
        round: { id: row.id, timestamp: row.timestamp, sourceStationId: row.source_station_id, sourceStationName: row.source_station_name },
        previousTimestamp: row.previousTimestamp,
        stationWarning: row.station_warning,
        student: { id: row.studentId, vorname: row.vorname, nachname: row.nachname,
          klasse: row.klasse, roundCount: row.roundCount },
        message: 'Bereits gespeicherte Runde bestätigt',
      } : { success: true, stored: false, scanId });
    }
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

    if (sourceDeviceId && result.accepted && !result.idempotentReplay) {
      // Station telemetry must never turn a committed round into a failed scan response.
      recordStationHeartbeat(sourceDeviceId, { scanned: true }).catch((error) => {
        console.error('Station scan telemetry failed:', error);
      });
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
      return res.status(409).json({
        success: false,
        error: 'DOUBLE_SCAN_CONFIRMATION_REQUIRED',
        scanId,
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
      scanId,
      requiresConfirmation: false,
      student: result.student,
      round: result.round,
      previousTimestamp: result.previousTimestamp,
      stationWarning: result.stationWarning,
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
