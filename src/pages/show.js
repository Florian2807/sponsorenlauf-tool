import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, timeAgo, API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';

export default function Show() {
  const [id, setID] = useState('');
  const [savedID, setSavedID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);

  const { request, loading, error } = useApi();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const cleanId = useCallback((rawId) => {
    return rawId.replace(new RegExp(`${new Date().getFullYear()}[ß/\\-]`, 'gm'), '');
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    const cleanedId = cleanId(id);

    try {
      const data = await request(`/api/students/${cleanedId}`);
      setStudentInfo(data);
      setCurrentTimestamp(new Date());
      setID('');
      setMessage('');
      setMessageType('');
    } catch (error) {
      setID('');
      setStudentInfo(null);
      setMessage('Schüler nicht gefunden');
      setMessageType('error');
    }
  }, [id, cleanId, request]);

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
      <h1 className="page-title">Schüler anzeigen</h1>
      <p className="message message-warning">Achtung: Hier werden keine Runden hinzugefügt, nur die Schülerdaten angezeigt.</p>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          ref={inputRef}
          value={id}
          onChange={(e) => { setSavedID(e.target.value); setID(e.target.value) }}
          placeholder="Barcode scannen"
          required
          className="form-control"
        />
        <button type="submit" className="btn">Anzeigen</button>
      </form>
      {message && (
        <p className={`message ${messageType === 'success' ? 'message-success' : 'message-error'}`}>{message}</p>
      )}
      {studentInfo && (
        <div className="student-info">
          <h2>Schüler-Informationen</h2>
          <p><strong>Klasse:</strong> {studentInfo.klasse}</p>
          <p><strong>Name:</strong> {studentInfo.vorname} {studentInfo.nachname}</p>
          <p><strong>Geschlecht:</strong> {studentInfo.geschlecht || 'Nicht angegeben'}</p>
          <p><strong>Gelaufene Runden:</strong> {studentInfo.timestamps.length}</p>

          {studentInfo.timestamps && studentInfo.timestamps.length > 0 && (
            <div className="mt-3">
              <h3>Scan-Timestamps:</h3>
              <ul className="timestamp-list">
                {studentInfo.timestamps.map((timestamp, index) => (
                  <li key={index} className="timestamp-item">
                    <span>{formatDate(new Date(timestamp)) + " Uhr => " + timeAgo(currentTimestamp, new Date(timestamp))}</span>
                    <button
                      type="button"
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