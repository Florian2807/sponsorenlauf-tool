import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, timeAgo } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import ErrorDialog from '../components/dialogs/scan/ErrorDialog';

export default function Scan() {
  const [id, setID] = useState('');
  const [savedID, setSavedID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);

  const { request, loading, error } = useApi();
  const inputRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        popupRef.current.showModal();
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
    const cleanedId = cleanId(id);

    try {
      const response = await request('/api/runden', {
        method: 'POST',
        data: { id: cleanedId, date: new Date() }
      });

      if (response.success) {
        const studentData = await request(`/api/students/${cleanedId}`);
        setStudentInfo(studentData);
        setCurrentTimestamp(new Date());
        setMessage('Runde erfolgreich gezählt!');
        setMessageType('success');
        setID('');
      } else {
        setID('');
        setMessage('Fehler beim Scannen der Runde');
        setMessageType('error');
        setStudentInfo(null);
      }
    } catch (error) {
      setID('');
      if (error.message.includes('404')) {
        setMessage('Datensatz nicht gefunden');
        setMessageType('error');
      } else {
        console.error(error);
        setMessage('Fehler beim Speichern der Runde');
        setMessageType('error');
      }
      setStudentInfo(null);
    }
  }, [cleanId, id, request]);

  const handleDeleteTimestamp = useCallback(async (selectedStudent, indexToRemove) => {
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
    } catch (error) {
      setMessage('Fehler beim Löschen des Zeitstempels');
      setMessageType('error');
    }
  }, [cleanId, savedID, request]);

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
          className="input"
        />
        <button type="submit" className="btn">Runde zählen</button>
      </form>

      <ErrorDialog dialogRef={popupRef} />

      {message && (
        <p className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>{message}</p>
      )}

      {studentInfo && (
        <div className="student-info">
          <h2>Schüler-Informationen</h2>
          <p><strong>Klasse:</strong> {studentInfo.klasse}</p>
          <p><strong>Name:</strong> {studentInfo.vorname} {studentInfo.nachname}</p>
          <p><strong>Gelaufene Runden:</strong> {studentInfo.timestamps.length}</p>

          {studentInfo.timestamps && studentInfo.timestamps.length > 0 && (
            <div className="mt-2">
              <h3>Scan-Timestamps:</h3>
              <ul className="timestamp-list">
                {studentInfo.timestamps.map((timestamp, index) => (
                  <li key={index} className="timestamp-item">
                    <span>{formatDate(new Date(timestamp)) + " Uhr => " + timeAgo(currentTimestamp, new Date(timestamp))}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTimestamp(studentInfo, index)}
                    >
                      Löschen
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