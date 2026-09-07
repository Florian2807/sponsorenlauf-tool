import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatDate, timeAgo, calculateTimeDifference } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import DoubleScanConfirmationDialog from '../components/dialogs/scan/DoubleScanConfirmationDialog';
import { cleanScannedStudentId } from '../utils/studentId';
import axios from 'axios';

const PENDING_SCAN_STORAGE_KEY = 'sponsorenlauf.pendingScan';
const SCAN_QUEUE_STORAGE_KEY = 'sponsorenlauf.scanQueue';
const DEVICE_ID_STORAGE_KEY = 'sponsorenlauf.deviceId';
const MAX_QUEUED_SCANS = 500;
const MAX_QUEUED_SCAN_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isValidQueuedScan = (entry) => (
  entry
  && typeof entry.cleanedId === 'string'
  && typeof entry.scanId === 'string'
  && entry.scanId.length >= 8
  && entry.scanId.length <= 100
  && Number.isFinite(Date.parse(entry.createdAt))
  && Date.now() - Date.parse(entry.createdAt) <= MAX_QUEUED_SCAN_AGE_MS
);

const createClientId = (prefix) => {
  const randomPart = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomPart}`;
};

export default function Scan() {
  const [id, setID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [timestampsLoading, setTimestampsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [doubleScanData, setDoubleScanData] = useState(null);
  const [queuedScanCount, setQueuedScanCount] = useState(0);

  const { request, loading } = useApi();
  const { showError } = useGlobalError();
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const doubleScanDialogRef = useRef(null);
  const idRef = useRef('');
  const pendingScanRef = useRef(null);
  const deviceIdRef = useRef(null);
  const scanQueueRef = useRef([]);
  const flushingQueueRef = useRef(false);
  const audioContextRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  }, []);

  const playErrorSound = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const startAt = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.01);
    gain.gain.setValueAtTime(0.22, startAt + 0.28);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.36);
    gain.connect(audioContext.destination);

    const firstTone = audioContext.createOscillator();
    firstTone.type = 'square';
    firstTone.frequency.setValueAtTime(330, startAt);
    firstTone.connect(gain);
    firstTone.start(startAt);
    firstTone.stop(startAt + 0.14);

    const secondTone = audioContext.createOscillator();
    secondTone.type = 'square';
    secondTone.frequency.setValueAtTime(180, startAt + 0.17);
    secondTone.connect(gain);
    secondTone.start(startAt + 0.17);
    secondTone.stop(startAt + 0.36);
  }, [getAudioContext]);

  useEffect(() => {
    let deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) {
      deviceId = createClientId('device');
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
    deviceIdRef.current = deviceId;

    let queue = [];
    try {
      queue = JSON.parse(window.localStorage.getItem(SCAN_QUEUE_STORAGE_KEY) || '[]');
      if (!Array.isArray(queue)) queue = [];
      queue = queue.filter(isValidQueuedScan).slice(-MAX_QUEUED_SCANS);
    } catch {
      queue = [];
    }

    const storedPendingScan = window.localStorage.getItem(PENDING_SCAN_STORAGE_KEY);
    if (storedPendingScan) {
      try {
        const pendingScan = JSON.parse(storedPendingScan);
        if (pendingScan?.cleanedId && pendingScan?.scanId) {
          if (!queue.some((entry) => entry.scanId === pendingScan.scanId)) queue.push(pendingScan);
          window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);
        }
      } catch {
        window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);
      }
    }

    scanQueueRef.current = queue;
    window.localStorage.setItem(SCAN_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    setQueuedScanCount(queue.length);
    if (queue.length) {
      setMessage(`${queue.length} nicht bestätigte Scan(s) werden automatisch erneut gesendet.`);
      setMessageType('warning');
    }

    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const sendHeartbeat = () => {
      if (!deviceIdRef.current) return;
      axios.post('/api/stations/heartbeat', { deviceId: deviceIdRef.current }, { timeout: 5000 }).catch(() => {});
    };
    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => () => {
    audioContextRef.current?.close().catch(() => {});
  }, []);

  // Fokus nach Submit wiederherstellen
  useEffect(() => {
    if (!isProcessing) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isProcessing]);

  // Dialog öffnen sobald doubleScanData gesetzt wird
  useEffect(() => {
    if (doubleScanData && doubleScanDialogRef.current) {
      doubleScanDialogRef.current.showModal();
    }
  }, [doubleScanData]);

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (document.querySelector('dialog[open]')) {
        return;
      }

      if (document.activeElement === inputRef.current) {
        return;
      }

      if (event.key === 'Tab' || event.key === 'Escape') {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        inputRef.current?.focus();
        formRef.current?.requestSubmit();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        inputRef.current?.focus();
        const nextValue = idRef.current.slice(0, -1);
        idRef.current = nextValue;
        setID(nextValue);
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      const nextValue = `${idRef.current}${event.key}`;
      idRef.current = nextValue;
      setID(nextValue);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const cleanId = useCallback((rawId) => {
    return cleanScannedStudentId(rawId);
  }, []);

  const handleInputChange = useCallback((e) => {
    idRef.current = e.target.value;
    setID(e.target.value);
  }, []);

  const rememberPendingScan = useCallback((pendingScan) => {
    pendingScanRef.current = pendingScan;
    window.localStorage.setItem(PENDING_SCAN_STORAGE_KEY, JSON.stringify(pendingScan));
  }, []);

  const clearPendingScan = useCallback(() => {
    pendingScanRef.current = null;
    window.localStorage.removeItem(PENDING_SCAN_STORAGE_KEY);
  }, []);

  const persistQueue = useCallback((queue) => {
    scanQueueRef.current = queue;
    window.localStorage.setItem(SCAN_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    setQueuedScanCount(queue.length);
  }, []);

  const enqueueScan = useCallback((pendingScan) => {
    if (!pendingScan?.scanId) return;
    const queue = scanQueueRef.current.some((entry) => entry.scanId === pendingScan.scanId)
      ? scanQueueRef.current
      : [...scanQueueRef.current, pendingScan].slice(-MAX_QUEUED_SCANS);
    persistQueue(queue);
  }, [persistQueue]);

  // Funktion zum asynchronen Laden der Timestamps
  const loadTimestamps = useCallback(async (studentId) => {
    setTimestampsLoading(true);
    try {
      const response = await request(`/api/students/${studentId}/timestamps`);
      const loadedRounds = response.rounds
        || (response.timestamps || []).map((timestamp, index) => ({ id: `legacy-${index}`, timestamp }));
      setRounds(loadedRounds);
    } catch (error) {
      console.warn('Timestamps konnten nicht geladen werden:', error);
      setRounds([]);
    } finally {
      setTimestampsLoading(false);
    }
  }, [request]);

  const performScan = useCallback(async (cleanedId, confirmDoubleScan = false, scanId) => {
    let processingHandled = false; // Flag um sicherzustellen, dass Loading-State korrekt behandelt wird
    
    try {
      const response = await request('/api/runden', {
        method: 'POST',
        showErrorMessage: false,
        data: {
          id: cleanedId,
          confirmDoubleScan,
          scanId,
          sourceDeviceId: deviceIdRef.current,
        }
      });

      // Server antwortet IMMER mit 200 bei gültigen Anfragen
      if (response?.success) {
        
        // Fall 1: Server möchte Bestätigung für Doppel-Scan
        if (response.requiresConfirmation) {
          // State setzen
          setDoubleScanData({
            student: response.student,
            lastRoundTime: response.lastRoundTime,
            thresholdMinutes: response.thresholdMinutes || 5,
            cleanedId,
            scanId,
          });
          setMessage('Doppel-Scan erkannt - bitte bestätigen');
          setMessageType('warning');
          setIsProcessing(false);
          processingHandled = true;
          return;
        }

        // Fall 2: Runde wurde erfolgreich gespeichert
        setStudentInfo(response.student);
        setCurrentTimestamp(new Date());
        setMessage(response.message || 'Runde erfolgreich gezählt!');
        setMessageType('success');
        idRef.current = '';
        setID('');
        setDoubleScanData(null);
        clearPendingScan();

        if (response.round) {
          setRounds((currentRounds) => [
            response.round,
            ...currentRounds.filter((round) => round.id !== response.round.id)
          ]);
        }

        // Timestamps asynchron laden
        loadTimestamps(cleanedId);
      }
    } catch (error) {
      // Echte Fehler und Block-Modus landen hier
      const isRecoverableFailure = !error.status || error.status >= 500 || error.status === 429;

      if (isRecoverableFailure) {
        enqueueScan(pendingScanRef.current);
        clearPendingScan();
        idRef.current = '';
        setID('');
        setMessage('Verbindung unterbrochen – Scan sicher vorgemerkt und wird automatisch erneut gesendet');
        setMessageType('warning');
        return;
      }

      idRef.current = '';
      setID('');
      clearPendingScan();
      playErrorSound();

      if (error.status === 404) {
        setMessage('Schüler mit dieser ID nicht gefunden');
        setMessageType('error');
      } else if (error.status === 400) {
        // Prüfe verschiedene Error-Strukturen für Block-Modus
        const errorData = error.data || error.response?.data || error || {};
        const errorCode = errorData.error || error.error;
        const errorMessage = errorData.message || error.message || '';
        
        if (errorCode === 'DOUBLE_SCAN_BLOCKED' || errorMessage.includes('Doppel-Scan blockiert')) {
          // Block-Modus: Scan wurde komplett abgelehnt
          if (errorData.timeDifferenceMs && errorData.student) {
            // Detaillierte Fehlermeldung mit Schülerinfo
            const timeDiffMinutes = Math.floor(errorData.timeDifferenceMs / 60000);
            const timeDiffSeconds = Math.floor((errorData.timeDifferenceMs % 60000) / 1000);
            const timeDisplay = timeDiffMinutes > 0 
              ? `${timeDiffMinutes} Minute${timeDiffMinutes !== 1 ? 'n' : ''} und ${timeDiffSeconds} Sekunde${timeDiffSeconds !== 1 ? 'n' : ''}`
              : `${timeDiffSeconds} Sekunde${timeDiffSeconds !== 1 ? 'n' : ''}`;
            
            setMessage(`⚠️ Doppel-Scan blockiert: ${errorData.student.vorname} ${errorData.student.nachname} wurde erst vor ${timeDisplay} gescannt. Mindestabstand: ${errorData.thresholdMinutes} Minuten.`);
            setStudentInfo(errorData.student);
          } else {
            // Einfache Fehlermeldung vom Server
            setMessage(`⚠️ ${errorMessage}`);
          }
          setMessageType('error');
        } else {
          // Fallback für andere 400-Fehler
          setMessage(errorMessage || 'Ungültige ID oder Eingabe');
          setMessageType('error');
        }
      }
      
      const responseErrorCode = error.response?.data?.error;
      if (error.status !== 400 || responseErrorCode !== 'DOUBLE_SCAN_BLOCKED') {
        setStudentInfo(null);
      }
      setRounds([]);
    } finally {
      // Stelle sicher, dass Processing immer gestoppt wird (außer bei Dialog)
      if (!processingHandled) {
        setIsProcessing(false);
      }
    }
  }, [request, loadTimestamps, clearPendingScan, enqueueScan, playErrorSound]);

  const flushScanQueue = useCallback(async () => {
    if (flushingQueueRef.current || !navigator.onLine || scanQueueRef.current.length === 0) return;
    flushingQueueRef.current = true;
    try {
      while (scanQueueRef.current.length > 0 && navigator.onLine) {
        const pendingIndex = scanQueueRef.current.findIndex((entry) => !entry.requiresConfirmation);
        if (pendingIndex === -1) break;
        const pending = scanQueueRef.current[pendingIndex];
        try {
          const response = await axios.post('/api/runden', {
            id: pending.cleanedId,
            scanId: pending.scanId,
            sourceDeviceId: deviceIdRef.current,
            confirmDoubleScan: false,
          }, { timeout: 10000 });
          if (response.data?.requiresConfirmation || response.data?.data?.requiresConfirmation) {
            setMessage('Ein vorgemerkter Scan benötigt eine Doppel-Scan-Bestätigung. Bitte Barcode erneut scannen.');
            setMessageType('warning');
            persistQueue(scanQueueRef.current.map((entry) => (
              entry.scanId === pending.scanId ? { ...entry, requiresConfirmation: true } : entry
            )));
            continue;
          }
          persistQueue(scanQueueRef.current.filter((entry) => entry.scanId !== pending.scanId));
          setMessage('Vorgemerkter Scan wurde erfolgreich nachgetragen');
          setMessageType('success');
        } catch (error) {
          if (!error.response || error.response.status >= 500 || error.response.status === 429) break;
          persistQueue(scanQueueRef.current.filter((entry) => entry.scanId !== pending.scanId));
          setMessage(`Vorgemerkter Scan wurde verworfen: ${error.response?.data?.message || 'ungültige Daten'}`);
          setMessageType('error');
        }
      }
    } finally {
      flushingQueueRef.current = false;
    }
  }, [persistQueue]);

  useEffect(() => {
    const handleOnline = () => flushScanQueue();
    window.addEventListener('online', handleOnline);
    const interval = window.setInterval(flushScanQueue, 5000);
    flushScanQueue();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.clearInterval(interval);
    };
  }, [flushScanQueue]);

  const handleDoubleScanConfirm = useCallback(async () => {
    if (!doubleScanData) return;

    doubleScanDialogRef.current?.close();
    setIsProcessing(true);
    setMessage('Verarbeite...');
    setMessageType('info');

    await performScan(doubleScanData.cleanedId, true, doubleScanData.scanId); // confirmDoubleScan = true
    // performScan handled setIsProcessing(false)

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [doubleScanData, performScan]);

  const handleDoubleScanCancel = useCallback(() => {
    doubleScanDialogRef.current?.close();
    setDoubleScanData(null);
    clearPendingScan();
    idRef.current = '';
    setID('');
    setMessage('Scan abgebrochen - möglicher Doppel-Scan erkannt');
    setMessageType('warning');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [clearPendingScan]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (isProcessing) return; // Verhindere mehrfache Submissions

    // Initializing audio during the scanner's key event keeps sound available
    // in browsers that require a user gesture before playing audio.
    getAudioContext();

    const cleanedId = cleanId(idRef.current);
    if (!cleanedId.trim()) {
      setMessage('Bitte geben Sie eine gültige ID ein');
      setMessageType('error');
      playErrorSound();
      // Fokus behalten bei Validierungsfehlern
      inputRef.current?.focus();
      return;
    }

    setIsProcessing(true);
    setMessage('Verarbeite...');
    setMessageType('info');

    const queuedPendingScan = scanQueueRef.current.find((scan) => scan.cleanedId === cleanedId);
    const existingPendingScan = pendingScanRef.current || queuedPendingScan;
    const scanId = existingPendingScan?.cleanedId === cleanedId
      ? existingPendingScan.scanId
      : createClientId('scan');
    if (queuedPendingScan?.scanId === scanId) {
      persistQueue(scanQueueRef.current.filter((scan) => scan.scanId !== scanId));
    }
    rememberPendingScan({ cleanedId, scanId, createdAt: new Date().toISOString() });

    await performScan(cleanedId, false, scanId); // confirmDoubleScan = false
    
    // Fokus nach Verarbeitung wiederherstellen (performScan handled setIsProcessing)
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [cleanId, getAudioContext, isProcessing, performScan, persistQueue, playErrorSound, rememberPendingScan]);

  const handleDeleteTimestamp = useCallback(async (roundId) => {
    if (!roundId || !studentInfo) {
      showError('Ungültige Runden-ID oder fehlende Schülerinformationen', 'Beim Löschen des Zeitstempels');
      return;
    }

    try {
      await request(`/api/rounds/${roundId}`, {
        method: 'DELETE',
        data: { studentId: studentInfo.id }
      });

      const updatedRounds = rounds.filter((round) => round.id !== roundId);
      setRounds(updatedRounds);

      // Aktualisiere auch die Rundenzahl im studentInfo
      setStudentInfo(prevStudentInfo => ({
        ...prevStudentInfo,
        roundCount: Math.max(0, Number(prevStudentInfo.roundCount) - 1),
      }));

      setMessage('Zeitstempel erfolgreich gelöscht');
      setMessageType('success');
    } catch (error) {
      showError(error, 'Beim Löschen des Zeitstempels');
    }
  }, [rounds, studentInfo, request, showError]);

  const sortedRounds = useMemo(
    () => rounds.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [rounds]
  );

  const latestTimestamp = sortedRounds[0]?.timestamp || null;
  const previousTimestamp = sortedRounds[1]?.timestamp || null;

  const latestTimestampMinutesAgo = useMemo(() => {
    if (!latestTimestamp) {
      return 'Bereit';
    }

    const previousRoundDifference = calculateTimeDifference(latestTimestamp, previousTimestamp);

    if (!previousRoundDifference) {
      return 'Erste Runde';
    }

    return previousRoundDifference;
  }, [latestTimestamp, previousTimestamp]);

  return (
    <div className="page-container-wide scan-dashboard">
      <div className="scan-dashboard-header">
        <h1 className="page-title scan-dashboard-title">Runden zählen</h1>

        <div className="scan-status" aria-live="polite">
          <span className={`status-pill ${isProcessing ? 'status-pill-warning' : 'status-pill-ready'}`}>
            {isProcessing ? 'Scan wird verarbeitet' : 'Scanner bereit'}
          </span>
          {queuedScanCount > 0 && (
            <span className="status-pill status-pill-warning">{queuedScanCount} Scan(s) vorgemerkt</span>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`message ${messageType === 'success' ? 'message-success' :
            messageType === 'warning' ? 'message-warning' :
              messageType === 'info' ? 'message-info' :
                'message-error'
            }`}
          role={messageType === 'error' ? 'alert' : 'status'}
          aria-live={messageType === 'error' ? 'assertive' : 'polite'}
        >
          {message}
        </div>
      )}

      <div className="scan-dashboard-layout">
        <aside className="scan-sidebar">
          <div className="scan-input-panel" data-tour="scan">
            <div className="scan-input-panel-header">
              <h2>Scanner</h2>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="form">
              <input
                id="scan-id"
                type="text"
                ref={inputRef}
                value={id}
                onChange={handleInputChange}
                placeholder="Barcode scannen"
                required
                disabled={isProcessing}
                className="input scan-input-compact"
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn"
                disabled={isProcessing}
              >
                {isProcessing ? 'Verarbeite...' : 'Runde zählen'}
              </button>
            </form>
          </div>
        </aside>

        <section className="scan-primary-column">
          {studentInfo ? (
            <>
              <div className="scan-student-hero">
                <div className="scan-student-identity">
                  <span className="scan-student-class">Klasse {studentInfo.klasse}</span>
                  <h2>{studentInfo.vorname} {studentInfo.nachname}</h2>
                  <p>ID {studentInfo.id}</p>
                </div>

                <div className="scan-round-summary">
                  <span>Runden gesamt</span>
                  <strong>{studentInfo.roundCount || 0}</strong>
                </div>
              </div>

              <div className="scan-student-metrics">
                <div className="scan-metric-card">
                  <span>Letzte Erfassung</span>
                  <strong>{latestTimestampMinutesAgo}</strong>
                </div>
                <div className="scan-metric-card">
                  <span>Zuletzt um</span>
                  <strong>{latestTimestamp ? `${formatDate(new Date(latestTimestamp))} Uhr` : 'Noch keine Runde'}</strong>
                </div>
                <div className="scan-metric-card">
                  <span>Status</span>
                  <strong>{messageType === 'error' ? 'Prüfen' : messageType === 'warning' ? 'Bestätigung nötig' : 'Erfasst'}</strong>
                </div>
              </div>

              <div className="student-info-card">
                <h3>Scan-Timestamps</h3>
                {timestampsLoading ? (
                  <p className="message message-info" style={{ fontSize: '0.9em', opacity: 0.8 }}>Lade Details...</p>
                ) : sortedRounds.length > 0 ? (
                  <ul className="timestamp-list">
                    {sortedRounds.map((round, index, sortedArray) => {
                      const timestamp = round.timestamp;
                      const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1].timestamp : null;
                      const timeDifference = calculateTimeDifference(timestamp, previousTimestamp);

                      return (
                        <li key={round.id} className="timestamp-item">
                          <span>
                            {formatDate(new Date(timestamp))} Uhr {'->'} {timeAgo(currentTimestamp, new Date(timestamp))}
                            {timeDifference && (
                              <span style={{ color: '#666', marginLeft: '8px', fontSize: '0.9em' }}>
                                (+{timeDifference})
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTimestamp(round.id)}
                            disabled={isProcessing || loading}
                            aria-label={`Zeitstempel ${formatDate(new Date(timestamp))} löschen`}
                          >
                            {loading ? 'Lösche...' : 'Löschen'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="empty-state">Für diesen Schüler wurden noch keine Runden erfasst.</div>
                )}
              </div>
            </>
          ) : (
            <div className="scan-empty-hero">
              <h2>Noch kein Schüler gescannt</h2>
            </div>
          )}
        </section>
      </div>

      {doubleScanData && (
        <DoubleScanConfirmationDialog
          dialogRef={doubleScanDialogRef}
          studentInfo={doubleScanData.student}
          lastRoundTime={doubleScanData.lastRoundTime}
          thresholdMinutes={doubleScanData.thresholdMinutes}
          onConfirm={handleDoubleScanConfirm}
          onCancel={handleDoubleScanCancel}
        />
      )}
    </div>
  );
}
