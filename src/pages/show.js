import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, timeAgo, calculateTimeDifference, API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';

export default function Show() {
  const [id, setID] = useState('');
  const [savedID, setSavedID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const { request, loading, error } = useApi();
  const { showError, showSuccess } = useGlobalError();
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
      const data = await request(`/api/students/${cleanedId}`, {
        errorContext: 'Beim Laden der Schülerdaten'
      });
      setStudentInfo(data);
      setCurrentTimestamp(new Date());
      setID('');
    } catch (error) {
      setID('');
      setStudentInfo(null);
      showError('Schüler nicht gefunden', 'Schülersuche');
    }
  }, [id, cleanId, request, showError]);

  const handleDeleteTimestamp = useCallback(async (selectedStudent, indexToRemove) => {
    const updatedTimestamps = selectedStudent.timestamps.filter((_, index) => index !== indexToRemove);
    const cleanedId = cleanId(savedID);

    try {
      await request(`/api/students/${cleanedId}`, {
        method: 'PUT',
        data: { timestamps: updatedTimestamps },
        errorContext: 'Beim Löschen des Zeitstempels'
      });
      setStudentInfo(prevStudentInfo => ({
        ...prevStudentInfo,
        timestamps: updatedTimestamps,
      }));
      showSuccess('Zeitstempel erfolgreich gelöscht', 'Zeitstempel löschen');
    } catch (error) {
      // Fehler wird automatisch über useApi gehandelt
    }
  }, [cleanId, savedID, request, showSuccess]);

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
                {studentInfo.timestamps
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
                          onClick={() => handleDeleteTimestamp(studentInfo, studentInfo.timestamps.findIndex(ts => ts === timestamp))}
                        >
                          Löschen
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}