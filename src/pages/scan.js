import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, timeAgo } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import ErrorDialog from '../components/dialogs/scan/ErrorDialog';

export default function Scan() {
  const [id, setID] = useState('');
  const [savedID, setSavedID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { request, loading } = useApi();
  const { showError } = useGlobalError();
  const inputRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        popupRef.current?.showModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanId = useCallback((rawId) => {
    return rawId.replace(new RegExp(`${new Date().getFullYear()}[ß/\\-]`, 'gm'), '');
  }, []);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setID(newValue);
    setSavedID(newValue);
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (isProcessing) return; // Verhindere mehrfache Submissions

    const cleanedId = cleanId(id);
    if (!cleanedId.trim()) {
      setMessage('Bitte geben Sie eine gültige ID ein');
      setMessageType('error');
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
        // API gibt jetzt direkt die vollständigen Schülerdaten zurück
        setStudentInfo(response.student);
        setCurrentTimestamp(new Date());
        setMessage('Runde erfolgreich gezählt!');
        setMessageType('success');
        setID('');

        // Fokus zurück auf das Input-Feld
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);

        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 3000);
      } else {
        setID('');
        setMessage('Fehler beim Scannen der Runde');
        setMessageType('error');
        setStudentInfo(null);

        // Fokus zurück auf das Input-Feld
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
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

      // Fokus zurück auf das Input-Feld auch bei Fehlern
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } finally {
      setIsProcessing(false);
    }
  }, [cleanId, id, request, showError, isProcessing]);

  const handleDeleteTimestamp = useCallback(async (selectedStudent, indexToRemove) => {
    if (!selectedStudent?.timestamps || indexToRemove < 0 || indexToRemove >= selectedStudent.timestamps.length) {
      showError('Ungültiger Zeitstempel-Index', 'Beim Löschen des Zeitstempels');
      return;
    }

    const updatedTimestamps = selectedStudent.timestamps.filter((_, index) => index !== indexToRemove);
    const cleanedId = cleanId(savedID);

    try {
      await request(`/api/students/${cleanedId}`, {
        method: 'PUT',
        data: { timestamps: updatedTimestamps }
      });

      setStudentInfo(prevStudentInfo => ({
        ...prevStudentInfo,
        timestamps: updatedTimestamps,
      }));

      setMessage('Zeitstempel erfolgreich gelöscht');
      setMessageType('success');

      // Auto-clear message
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 2000);
    } catch (error) {
      showError(error, 'Beim Löschen des Zeitstempels');
    }
  }, [cleanId, savedID, request, showError]);

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
            <p><strong>Gelaufene Runden:</strong> {studentInfo.timestamps?.length || 0}</p>
          </div>

          {studentInfo.timestamps && studentInfo.timestamps.length > 0 && (
            <div className="mt-2">
              <h3>Scan-Timestamps:</h3>
              <ul className="timestamp-list">
                {studentInfo.timestamps.map((timestamp, index) => (
                  <li key={`${timestamp}-${index}`} className="timestamp-item">
                    <span>
                      {formatDate(new Date(timestamp)) + " Uhr => " + timeAgo(currentTimestamp, new Date(timestamp))}
                    </span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTimestamp(studentInfo, index)}
                      disabled={loading}
                      aria-label={`Zeitstempel ${formatDate(new Date(timestamp))} löschen`}
                    >
                      {loading ? 'Lösche...' : 'Löschen'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}