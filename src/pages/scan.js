import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatDate, timeAgo, calculateTimeDifference } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import DoubleScanConfirmationDialog from '../components/dialogs/scan/DoubleScanConfirmationDialog';
import { cleanScannedStudentId } from '../utils/studentId';

export default function Scan() {
  const [id, setID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [timestamps, setTimestamps] = useState([]);
  const [timestampsLoading, setTimestampsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [doubleScanData, setDoubleScanData] = useState(null);

  const { request, loading } = useApi();
  const { showError } = useGlobalError();
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const doubleScanDialogRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
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
        setID((currentValue) => currentValue.slice(0, -1));
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      setID((currentValue) => `${currentValue}${event.key}`);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const cleanId = useCallback((rawId) => {
    return cleanScannedStudentId(rawId);
  }, []);

  const handleInputChange = useCallback((e) => {
    setID(e.target.value);
  }, []);

  // Funktion zum asynchronen Laden der Timestamps
  const loadTimestamps = useCallback(async (studentId) => {
    setTimestampsLoading(true);
    try {
      const response = await request(`/api/students/${studentId}/timestamps`);
      setTimestamps(response.timestamps || []);
    } catch (error) {
      console.warn('Timestamps konnten nicht geladen werden:', error);
      setTimestamps([]);
    } finally {
      setTimestampsLoading(false);
    }
  }, [request]);

  const performScan = useCallback(async (cleanedId, confirmDoubleScan = false) => {
    let processingHandled = false; // Flag um sicherzustellen, dass Loading-State korrekt behandelt wird
    
    try {
      const response = await request('/api/runden', {
        method: 'POST',
        data: { id: cleanedId, date: new Date(), confirmDoubleScan }
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
            cleanedId
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
        setID('');
        setDoubleScanData(null);

        // Timestamps asynchron laden
        loadTimestamps(cleanedId);
      }
    } catch (error) {
      // Echte Fehler und Block-Modus landen hier
      setID('');
      
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
      } else {
        setMessage('Fehler beim Speichern der Runde');
        setMessageType('error');
        showError(error, 'Beim Speichern der Runde');
      }
      
      if (error.status !== 400 || error.data?.error !== 'DOUBLE_SCAN_BLOCKED') {
        setStudentInfo(null);
      }
      setTimestamps([]);
    } finally {
      // Stelle sicher, dass Processing immer gestoppt wird (außer bei Dialog)
      if (!processingHandled) {
        setIsProcessing(false);
      }
    }
  }, [request, showError, loadTimestamps]);

  const handleDoubleScanConfirm = useCallback(async () => {
    if (!doubleScanData) return;

    doubleScanDialogRef.current?.close();
    setIsProcessing(true);
    setMessage('Verarbeite...');
    setMessageType('info');

    await performScan(doubleScanData.cleanedId, true); // confirmDoubleScan = true
    // performScan handled setIsProcessing(false)

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [doubleScanData, performScan]);

  const handleDoubleScanCancel = useCallback(() => {
    doubleScanDialogRef.current?.close();
    setDoubleScanData(null);
    setMessage('Scan abgebrochen - möglicher Doppel-Scan erkannt');
    setMessageType('warning');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (isProcessing) return; // Verhindere mehrfache Submissions

    const cleanedId = cleanId(id);
    if (!cleanedId.trim()) {
      setMessage('Bitte geben Sie eine gültige ID ein');
      setMessageType('error');
      // Fokus behalten bei Validierungsfehlern
      inputRef.current?.focus();
      return;
    }

    setIsProcessing(true);
    setMessage('Verarbeite...');
    setMessageType('info');

    await performScan(cleanedId, false); // confirmDoubleScan = false
    
    // Fokus nach Verarbeitung wiederherstellen (performScan handled setIsProcessing)
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [cleanId, id, isProcessing, performScan]);

  const handleDeleteTimestamp = useCallback(async (indexToRemove) => {
    if (!timestamps || indexToRemove < 0 || indexToRemove >= timestamps.length || !studentInfo) {
      showError('Ungültiger Zeitstempel-Index oder fehlende Schülerinformationen', 'Beim Löschen des Zeitstempels');
      return;
    }

    const updatedTimestamps = timestamps.filter((_, index) => index !== indexToRemove);

    try {
      await request(`/api/students/${studentInfo.id}`, {
        method: 'PUT',
        data: { timestamps: updatedTimestamps }
      });

      setTimestamps(updatedTimestamps);

      // Aktualisiere auch die Rundenzahl im studentInfo
      setStudentInfo(prevStudentInfo => ({
        ...prevStudentInfo,
        roundCount: updatedTimestamps.length,
      }));

      setMessage('Zeitstempel erfolgreich gelöscht');
      setMessageType('success');
    } catch (error) {
      showError(error, 'Beim Löschen des Zeitstempels');
    }
  }, [timestamps, studentInfo, request, showError]);

  const sortedTimestamps = useMemo(
    () => timestamps.slice().sort((a, b) => new Date(b) - new Date(a)),
    [timestamps]
  );

  const latestTimestamp = sortedTimestamps[0] || null;
  const previousTimestamp = sortedTimestamps[1] || null;

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
          <span className={`status-pill ${isProcessing || loading ? 'status-pill-warning' : 'status-pill-ready'}`}>
            {isProcessing || loading ? 'Scan wird verarbeitet' : 'Scanner bereit'}
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

      <div className="scan-dashboard-layout">
        <aside className="scan-sidebar">
          <div className="scan-input-panel">
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
                disabled={isProcessing || loading}
                className="input scan-input-compact"
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn"
                disabled={isProcessing || loading}
              >
                {isProcessing || loading ? 'Verarbeite...' : 'Runde zählen'}
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
                  <span>Runden heute</span>
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
                ) : sortedTimestamps.length > 0 ? (
                  <ul className="timestamp-list">
                    {sortedTimestamps.map((timestamp, index, sortedArray) => {
                      const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1] : null;
                      const timeDifference = calculateTimeDifference(timestamp, previousTimestamp);

                      return (
                        <li key={`${timestamp}-${index}`} className="timestamp-item">
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
                            onClick={() => handleDeleteTimestamp(timestamps.findIndex(ts => ts === timestamp))}
                            disabled={loading}
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
