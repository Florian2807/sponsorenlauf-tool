import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { stationScopeLabel, stationModeLabel } from '../utils/stationDisplay';
import { useScannerStation } from '../contexts/ScannerStationContext';
import Link from 'next/link';
import { formatDate, timeAgo, calculateTimeDifference } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import DoubleScanConfirmationDialog from '../components/dialogs/scan/DoubleScanConfirmationDialog';
import { cleanScannedStudentId } from '../utils/studentId';
import { createClientId } from '../utils/clientId';
import axios from 'axios';

// Only the single in-flight operation survives reload; it is never sent automatically.
const ACTIVE_SCAN_STORAGE_KEY = 'sponsorenlauf.activeScan';
const DEVICE_ID_STORAGE_KEY = 'sponsorenlauf.deviceId';
const STATUS_CHECK_INTERVAL_MS = 2000;
const SLOW_STATUS_CHECK_INTERVAL_MS = 5000;
const UNRESOLVED_WARNING_AFTER_MS = 15000;

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
  const [unresolvedScan, setUnresolvedScan] = useState(null);
  const [releaseRequested, setReleaseRequested] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  const [statusDelayed, setStatusDelayed] = useState(false);

  const { request, loading } = useApi();
  const { showError } = useGlobalError();
  const { enabled: stationsEnabled, stationId, stations } = useScannerStation();
  const { authenticated } = useAdminAuth();
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const doubleScanDialogRef = useRef(null);
  const idRef = useRef('');
  const pendingScanRef = useRef(null);
  const deviceIdRef = useRef(null);
  const lockedRef = useRef(false);
  const statusRequestInFlightRef = useRef(false);
  const blockedBarcodeRef = useRef(false);
  const latestRoundsRequestRef = useRef(0);
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

    const playTone = (frequency, offset) => {
      const toneStart = startAt + offset;
      const toneEnd = toneStart + 0.22;
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, toneStart);
      gain.gain.exponentialRampToValueAtTime(0.28, toneStart + 0.01);
      gain.gain.setValueAtTime(0.28, toneEnd - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);
      gain.connect(audioContext.destination);

      const oscillator = audioContext.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency, toneStart);
      oscillator.connect(gain);
      oscillator.start(toneStart);
      oscillator.stop(toneEnd);
    };

    playTone(740, 0);
    playTone(520, 0.29);
  }, [getAudioContext]);

  useEffect(() => {
    let deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) {
      deviceId = createClientId('device');
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
    deviceIdRef.current = deviceId;

    try {
      const active = JSON.parse(window.sessionStorage.getItem(ACTIVE_SCAN_STORAGE_KEY) || 'null');
      if (active?.cleanedId && active?.scanId) {
        pendingScanRef.current = active;
        lockedRef.current = true;
        setUnresolvedScan(active);
        setMessage('Der letzte Scan ist ungeklärt. Der Speicherstatus wird automatisch geprüft.');
        setMessageType('warning');
      }
      // Preserve old browser queues for manual inspection, never replay them.
      const oldQueue = JSON.parse(window.localStorage.getItem('sponsorenlauf.scanQueue') || '[]');
      if (oldQueue?.length || window.localStorage.getItem('sponsorenlauf.pendingScan')) {
        setMessage('Es liegen alte vorgemerkte Scans im Browser vor. Diese werden nicht automatisch übertragen. Bitte vor dem Lauf mit der Administration klären.');
        setMessageType('warning');
      }
    } catch {
      setMessage('Browserdaten konnten nicht gelesen werden. Bitte prüfen.');
      setMessageType('error');
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
        if (document.querySelector('dialog[open]') || document.activeElement?.closest('header, .skip-link')) return;
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, unresolvedScan, doubleScanData]);

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

      if (lockedRef.current) {
        // Capture scanner characters before a focused dialog button receives Enter.
        if (event.key.length === 1 || event.key === 'Backspace') {
          event.preventDefault();
          event.stopImmediatePropagation();
          blockedBarcodeRef.current = true;
          return;
        }
        if (event.key === 'Enter' && (blockedBarcodeRef.current || document.activeElement === inputRef.current)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          blockedBarcodeRef.current = false;
          playErrorSound();
          return;
        }
        // Keyboard activation of an actual decision button remains available.
        return;
      }

      if (document.querySelector('dialog[open]')) return;
      if (event.target?.closest?.('[data-scanner-controls]')) return;
      // Navigation and controls keep their native keyboard actions.
      if (event.target !== inputRef.current && event.target?.closest?.('a, button, input, select, textarea, summary, [contenteditable="true"]')) return;

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

    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [playErrorSound]);

  const cleanId = useCallback((rawId) => {
    return cleanScannedStudentId(rawId);
  }, []);

  const handleInputChange = useCallback((e) => {
    idRef.current = e.target.value;
    setID(e.target.value);
  }, []);

  const rememberPendingScan = useCallback((scan) => {
    window.sessionStorage.setItem(ACTIVE_SCAN_STORAGE_KEY, JSON.stringify(scan));
    pendingScanRef.current = scan;
    lockedRef.current = true;
  }, []);

  const clearPendingScan = useCallback(() => {
    window.sessionStorage.removeItem(ACTIVE_SCAN_STORAGE_KEY);
    pendingScanRef.current = null;
    lockedRef.current = false;
    blockedBarcodeRef.current = false;
    setUnresolvedScan(null);
    setReleaseRequested(false);
    setStatusDelayed(false);
    setDoubleScanData(null);
  }, []);

  const loadTimestamps = useCallback(async (studentId, confirmedRound) => {
    const requestId = ++latestRoundsRequestRef.current;
    setTimestampsLoading(true);
    try {
      const response = await request(`/api/students/${studentId}/timestamps`);
      if (requestId !== latestRoundsRequestRef.current) return;
      const loaded = response.rounds || [];
      setRounds(confirmedRound && !loaded.some((round) => round.id === confirmedRound.id)
        ? [confirmedRound, ...loaded] : loaded);
    } catch (error) {
      console.warn('Timestamps konnten nicht geladen werden:', error);
    } finally {
      if (requestId === latestRoundsRequestRef.current) setTimestampsLoading(false);
    }
  }, [request]);

  const acceptStoredScan = useCallback((response, scan) => {
    if (!response?.success || response.scanId !== scan.scanId
      || !response.round?.id || !response.round?.timestamp || !response.student?.id) {
      throw new Error('Keine eindeutige Speicherbestätigung');
    }
    setStudentInfo(response.student);
    setCurrentTimestamp(new Date());
    setRounds([response.round]);
    setMessage(response.stationWarning ? `${response.message || 'Runde erfolgreich gezählt'}. Hinweis: ${response.stationWarning}` : response.message || 'Runde erfolgreich gezählt');
    setMessageType(response.stationWarning ? 'warning' : 'success');
    clearPendingScan();
    loadTimestamps(response.student.id, response.round);
    const context = getAudioContext();
    if (context) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
      oscillator.frequency.value = 880;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    }
  }, [clearPendingScan, getAudioContext, loadTimestamps]);

  const markUnresolved = useCallback((scan) => {
    lockedRef.current = true;
    setUnresolvedScan(scan);
    setMessage('Keine sichere Speicherbestätigung. Station gesperrt – Speicherstatus wird automatisch geprüft.');
    setMessageType('warning');
    playErrorSound();
  }, [playErrorSound]);

  const performScan = useCallback(async (scan) => {
    setIsProcessing(true);
    setUnresolvedScan(null);
    setReleaseRequested(false);
    try {
      const response = await request('/api/runden', {
        method: 'POST', showErrorMessage: false, timeout: 8000,
        data: { id: scan.cleanedId, scanId: scan.scanId,
          confirmDoubleScan: scan.confirmDoubleScan === true,
          sourceDeviceId: deviceIdRef.current, sourceStationId: scan.sourceStationId || null },
      });
      acceptStoredScan(response, scan);
    } catch (error) {
      if (error.status === 409 && error.data?.error === 'DOUBLE_SCAN_CONFIRMATION_REQUIRED'
        && error.data.scanId === scan.scanId && error.data.student) {
        playErrorSound();
        setDoubleScanData({ ...error.data, cleanedId: scan.cleanedId });
        setMessage('Doppel-Scan erkannt – bitte bestätigen oder abbrechen');
        setMessageType('warning');
      } else if (!error.status || error.status >= 500 || error.status === 429) {
        markUnresolved(scan);
      } else {
        clearPendingScan();
        playErrorSound();
        setMessage(error.status === 404 ? 'Schüler mit dieser ID nicht gefunden' : error.message);
        setMessageType('error');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [request, acceptStoredScan, clearPendingScan, markUnresolved, playErrorSound]);

  const checkScanStatus = useCallback(async () => {
    const scan = pendingScanRef.current;
    if (!scan || isProcessing || statusRequestInFlightRef.current) return;
    statusRequestInFlightRef.current = true;
    setStatusChecking(true);
    try {
      const response = await request('/api/runden', {
        showErrorMessage: false, timeout: 8000, params: { scanId: scan.scanId },
      });
      // A result arriving after an explicit release belongs to the old operation.
      if (pendingScanRef.current !== scan) return;
      if (response.stored === true) acceptStoredScan(response, scan);
      else {
        setMessage('Bisher keine gespeicherte Runde gefunden. Der Speicherstatus wird weiter automatisch geprüft. Bei Bedarf denselben Scan erneut senden.');
        setMessageType('warning');
      }
    } catch {
      if (pendingScanRef.current !== scan) return;
      setMessage('Speicherstatus nicht erreichbar. Die Station bleibt gesperrt; die automatische Prüfung läuft weiter.');
      setMessageType('warning');
    } finally {
      statusRequestInFlightRef.current = false;
      setStatusChecking(false);
    }
  }, [request, isProcessing, acceptStoredScan]);

  // Poll only the read endpoint. Never automatically resubmit a round.
  useEffect(() => {
    if (!unresolvedScan || isProcessing) return;
    const startedAt = Date.now();
    let stopped = false;
    let pollTimer;
    setStatusDelayed(false);
    const warningTimer = window.setTimeout(() => setStatusDelayed(true), UNRESOLVED_WARNING_AFTER_MS);
    const poll = async () => {
      await checkScanStatus();
      if (stopped || pendingScanRef.current !== unresolvedScan) return;
      const interval = Date.now() - startedAt >= UNRESOLVED_WARNING_AFTER_MS
        ? SLOW_STATUS_CHECK_INTERVAL_MS : STATUS_CHECK_INTERVAL_MS;
      pollTimer = window.setTimeout(poll, interval);
    };
    pollTimer = window.setTimeout(poll, 0);
    return () => {
      stopped = true;
      window.clearTimeout(pollTimer);
      window.clearTimeout(warningTimer);
    };
  }, [unresolvedScan, checkScanStatus, isProcessing]);

  const handleDoubleScanConfirm = useCallback(async () => {
    if (!doubleScanData || isProcessing) return;
    const scan = { ...pendingScanRef.current, confirmDoubleScan: true };
    try { rememberPendingScan(scan); } catch {
      setMessage('Vorgang konnte nicht gesichert werden. Bitte erneut versuchen.');
      setMessageType('error');
      return;
    }
    doubleScanDialogRef.current?.close();
    setDoubleScanData(null);
    await performScan(scan);
  }, [doubleScanData, isProcessing, rememberPendingScan, performScan]);

  const handleDoubleScanCancel = useCallback(() => {
    doubleScanDialogRef.current?.close();
    clearPendingScan();
    setMessage('Scan abgebrochen – keine weitere Runde gezählt');
    setMessageType('warning');
    inputRef.current?.focus();
  }, [clearPendingScan]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    getAudioContext();
    if (lockedRef.current) {
      playErrorSound();
      return;
    }
    const cleanedId = cleanId(idRef.current);
    if (!cleanedId.trim()) {
      setMessage('Bitte geben Sie eine gültige ID ein');
      setMessageType('error');
      playErrorSound();
      return;
    }
    const scan = { cleanedId, scanId: createClientId('scan'), sourceStationId: stationsEnabled ? stationId : null };
    try { rememberPendingScan(scan); } catch {
      setMessage('Vorgang konnte auf diesem Gerät nicht gesichert werden. Bitte Browserspeicher prüfen und erneut scannen.');
      setMessageType('error');
      playErrorSound();
      return;
    }
    idRef.current = '';
    setID('');
    setMessage('Verarbeite...');
    setMessageType('info');
    await performScan(scan);
  }, [cleanId, getAudioContext, performScan, playErrorSound, rememberPendingScan, stationsEnabled, stationId]);

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
      latestRoundsRequestRef.current += 1;
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
    <div className="app-page page-container-wide scan-dashboard">
      <div className="scan-dashboard-header">
        <h1 className="page-title scan-dashboard-title">Runden zählen</h1>

        <div className="scan-status" aria-live="polite">
          <span className={`status-pill ${isProcessing || unresolvedScan || doubleScanData ? 'status-pill-warning' : 'status-pill-ready'}`}>
            {isProcessing ? 'Scan wird verarbeitet' : unresolvedScan || doubleScanData ? 'Station gesperrt' : 'Scanner bereit'}
          </span>
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

      {unresolvedScan && (
        <div className="message message-warning" role="region" aria-label="Ungeklärter Scan">
          <p>Scan für ID {unresolvedScan.cleanedId}: Speicherstatus wird automatisch geprüft.</p>
          {statusDelayed && <p role="alert">Speicherung ungeklärt – Verbindung prüfen. Die automatische Statusprüfung läuft weiter.</p>}
          <button type="button" className="btn" disabled={isProcessing || statusChecking} onClick={checkScanStatus}>{statusChecking ? 'Speicherstatus wird geprüft...' : 'Speicherstatus prüfen'}</button>{' '}
          <button type="button" className="btn" disabled={isProcessing || statusChecking} onClick={() => performScan(pendingScanRef.current)}>Denselben Scan erneut senden</button>{' '}
          <details>
            <summary>Weitere Optionen</summary>
            <button type="button" className="btn btn-secondary" disabled={isProcessing} onClick={() => setReleaseRequested(true)}>Station freigeben</button>
          {releaseRequested && (
            <div>
              <p>Die Runde könnte bereits gespeichert sein oder noch gespeichert werden. Vor einem erneuten Scan dieser Person den Rundenstand prüfen.</p>
              <button type="button" className="btn btn-danger" disabled={isProcessing} onClick={() => {
                clearPendingScan();
                setMessage('Station bewusst freigegeben. Speicherstatus des letzten Scans bleibt ungeklärt.');
                setMessageType('warning');
                inputRef.current?.focus();
              }}>Ungeklärten Status quittieren und freigeben</button>{' '}
              <button type="button" className="btn" onClick={() => setReleaseRequested(false)}>Gesperrt lassen</button>
            </div>
          )}
          </details>
        </div>
      )}

      <div className="scan-dashboard-layout">
        <aside className="scan-sidebar">
          <div className="scan-input-panel" data-tour="scan">
            <div className="scan-input-panel-header">
              <h2>Barcode erfassen</h2>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="form">
              <input
                aria-label="Barcode scannen"
                id="scan-id"
                type="text"
                ref={inputRef}
                value={id}
                onChange={handleInputChange}
                placeholder="Barcode scannen"
                required
                disabled={isProcessing || !!unresolvedScan || !!doubleScanData}
                className="input scan-input-compact"
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn"
                disabled={isProcessing || !!unresolvedScan || !!doubleScanData}
              >
                {isProcessing ? 'Verarbeite...' : 'Runde zählen'}
              </button>
            </form>
            {stationsEnabled && stations.find((station) => station.id === stationId)?.mode !== 'allow'
              && stationScopeLabel(stations.find((station) => station.id === stationId)) !== 'Alle Klassen'
              && <p className="scan-station-rules">
                {stationScopeLabel(stations.find((station) => station.id === stationId))}
                <span>{stationModeLabel(stations.find((station) => station.id === stationId))}</span>
              </p>}
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

                <div className="scan-student-hero-actions">
                  {authenticated && (
                    <Link
                      href={{ pathname: '/manage', query: { student: studentInfo.id } }}
                      className="student-edit-action"
                      aria-label={`${studentInfo.vorname} ${studentInfo.nachname} bearbeiten`}
                    >
                      <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                      <span>Schüler bearbeiten</span>
                    </Link>
                  )}
                  <div className="scan-round-summary">
                    <span>Runden gesamt</span>
                    <strong>{studentInfo.roundCount || 0}</strong>
                  </div>
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
                  <strong>{messageType === 'error' ? 'Prüfen' : messageType === 'warning' ? (doubleScanData ? 'Bestätigung nötig' : 'Hinweis') : 'Erfasst'}</strong>
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
                            {stationsEnabled && round.sourceStationName && <span> · {round.sourceStationName}</span>}
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
              <i className="fa-solid fa-barcode scan-empty-icon" aria-hidden="true" />
              <h2>Bereit für den ersten Scan</h2>
              <p>Scanne einen Barcode. Die zuletzt erfasste Person erscheint hier.</p>
            </div>
          )}
        </section>
      </div>

      {doubleScanData && (
        <DoubleScanConfirmationDialog
          dialogRef={doubleScanDialogRef}
          studentInfo={doubleScanData.student}
          lastRoundTime={doubleScanData.lastRoundTime}
          lastStationName={doubleScanData.lastStationName}
          thresholdMinutes={doubleScanData.thresholdMinutes}
          onConfirm={handleDoubleScanConfirm}
          onCancel={handleDoubleScanCancel}
        />
      )}

    </div>
  );
}
