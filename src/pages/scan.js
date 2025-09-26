import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, timeAgo, calculateTimeDifference } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import ErrorDialog from '../components/dialogs/scan/ErrorDialog';
import DoubleScanConfirmationDialog from '../components/dialogs/scan/DoubleScanConfirmationDialog';

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
  const inputRef = useRef(null);
  const popupRef = useRef(null);
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

  // Enter-Handler für das gesamte Dokument
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        if (popupRef.current && popupRef.current.showModal) {
          popupRef.current.showModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dialog öffnen sobald doubleScanData gesetzt wird
  useEffect(() => {
    if (doubleScanData && doubleScanDialogRef.current) {
      doubleScanDialogRef.current.showModal();
    }
  }, [doubleScanData]);

  const cleanId = useCallback((rawId) => {
    return rawId.replace(new RegExp(`${new Date().getFullYear()}[ß/\\-]`, 'gm'), '');
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

  return (
    <div className="page-container">
      <h1 className="page-title-large">Sponsorenlauf {new Date().getFullYear()}</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          ref={inputRef}
          value={id}
          onChange={handleInputChange}
          placeholder="Barcode scannen"
          required
          disabled={isProcessing || loading}
          className="input"
        />
        <button
          type="submit"
          className="btn"
          disabled={isProcessing || loading}
        >
          {isProcessing || loading ? 'Verarbeite...' : 'Runde zählen'}
        </button>
      </form>

      <ErrorDialog dialogRef={popupRef} />

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

      {studentInfo && (
        <div className="student-info">
          <h2>Schüler-Informationen</h2>
          <div className="student-details">
            <p><strong>Klasse:</strong> {studentInfo.klasse}</p>
            <p><strong>Name:</strong> {studentInfo.vorname} {studentInfo.nachname}</p>
            <p><strong>Gelaufene Runden:</strong> {studentInfo.roundCount || 0}</p>
          </div>

          {timestampsLoading ? (
            <div className="mt-2">
              <h3>Scan-Timestamps:</h3>
              <p className="message message-info" style={{ fontSize: '0.9em', opacity: 0.8 }}>Lade Details...</p>
            </div>
          ) : timestamps && timestamps.length > 0 ? (
            <div className="mt-2">
              <h3>Scan-Timestamps:</h3>
              <ul className="timestamp-list">
                {timestamps
                  .slice() // Kopie erstellen
                  .sort((a, b) => new Date(b) - new Date(a)) // Neueste zuerst
                  .map((timestamp, index, sortedArray) => {
                    // Finde vorherige Runde (chronologisch früher)
                    const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1] : null;
                    const timeDifference = calculateTimeDifference(timestamp, previousTimestamp);
                    
                    return (
                      <li key={`${timestamp}-${index}`} className="timestamp-item">
                        <span>
                          {formatDate(new Date(timestamp)) + " Uhr => " + timeAgo(currentTimestamp, new Date(timestamp))}
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
            </div>
          ) : null}
        </div>
      )}

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