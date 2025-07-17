import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, timeAgo } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import ErrorDialog from '../components/dialogs/scan/ErrorDialog';

export default function Scan() {
  const [id, setID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [timestamps, setTimestamps] = useState([]);
  const [timestampsLoading, setTimestampsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { request, loading } = useApi();
  const { showError } = useGlobalError();
  const inputRef = useRef(null);
  const popupRef = useRef(null);

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

    try {
      const response = await request('/api/runden', {
        method: 'POST',
        data: { id: cleanedId, date: new Date() }
      });

      if (response?.success !== false && response?.student) {
        // API gibt jetzt schnell die Basisdaten zurück
        setStudentInfo(response.student);
        setCurrentTimestamp(new Date());
        setMessage('Runde erfolgreich gezählt!');
        setMessageType('success');
        setID('');

        // Timestamps asynchron laden (nicht blockierend)
        loadTimestamps(cleanedId);
      } else {
        setID('');
        setMessage('Fehler beim Scannen der Runde');
        setMessageType('error');
        setStudentInfo(null);
        setTimestamps([]);
      }
    } catch (error) {
      setID('');

      if (error.status === 404) {
        setMessage('Schüler mit dieser ID nicht gefunden');
        setMessageType('error');
      } else if (error.status === 400) {
        setMessage('Ungültige ID oder Eingabe');
        setMessageType('error');
      } else {
        setMessage('Fehler beim Speichern der Runde');
        setMessageType('error');
        showError(error, 'Beim Speichern der Runde');
      }
      setStudentInfo(null);
      setTimestamps([]);
    } finally {
      setIsProcessing(false);
    }
  }, [cleanId, id, request, showError, isProcessing, loadTimestamps]);

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
                {timestamps.map((timestamp, index) => (
                  <li key={`${timestamp}-${index}`} className="timestamp-item">
                    <span>
                      {formatDate(new Date(timestamp)) + " Uhr => " + timeAgo(currentTimestamp, new Date(timestamp))}
                    </span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTimestamp(index)}
                      disabled={loading}
                      aria-label={`Zeitstempel ${formatDate(new Date(timestamp))} löschen`}
                    >
                      {loading ? 'Lösche...' : 'Löschen'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}