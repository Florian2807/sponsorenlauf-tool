import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDate, timeAgo, calculateTimeDifference } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { cleanScannedStudentId } from '../utils/studentId';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function Show() {
  const [id, setID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const { request } = useApi();
  const { showError, showSuccess } = useGlobalError();
  const { authenticated } = useAdminAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const cleanId = useCallback((rawId) => {
    return cleanScannedStudentId(rawId);
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

  const handleDeleteTimestamp = useCallback(async (roundId) => {
    if (!studentInfo) return;
    try {
      await request(`/api/rounds/${roundId}`, {
        method: 'DELETE',
        data: { studentId: studentInfo.id },
        errorContext: 'Beim Löschen des Zeitstempels'
      });
      setStudentInfo((currentStudent) => {
        const rounds = currentStudent.rounds.filter((round) => round.id !== roundId);
        return {
          ...currentStudent,
          rounds,
          timestamps: rounds.map((round) => round.timestamp),
        };
      });
      showSuccess('Zeitstempel erfolgreich gelöscht', 'Zeitstempel löschen');
    } catch (error) {
      // Fehler wird automatisch über useApi gehandelt
    }
  }, [request, showSuccess, studentInfo]);

  return (
    <div className="page-container">
      <h1 className="page-title">Schüler anzeigen</h1>
      <p className="message message-warning">Achtung: Hier werden keine Runden hinzugefügt, nur die Schülerdaten angezeigt.</p>
      <form onSubmit={handleSubmit} className="form" data-tour="show">
        <label className="form-label" htmlFor="show-id">Barcode oder Schüler-ID</label>
        <input
          id="show-id"
          type="text"
          ref={inputRef}
          value={id}
          onChange={(e) => setID(e.target.value)}
          placeholder="Barcode scannen"
          required
          className="form-control"
          autoComplete="off"
        />
        <span className="field-hint">Hier werden nur Daten angezeigt. Es wird keine neue Runde gespeichert.</span>
        <button type="submit" className="btn">Anzeigen</button>
      </form>
      {studentInfo && (
        <div className="student-info">
          <h2>Schüler-Informationen</h2>
          <p><strong>Klasse:</strong> {studentInfo.klasse}</p>
          <p><strong>Name:</strong> {studentInfo.vorname} {studentInfo.nachname}</p>
          <p><strong>Geschlecht:</strong> {studentInfo.geschlecht || 'Nicht angegeben'}</p>
          <p><strong>Gelaufene Runden:</strong> {studentInfo.rounds.length}</p>

          {studentInfo.rounds && studentInfo.rounds.length > 0 && (
            <div className="mt-3">
              <h3>Scan-Timestamps:</h3>
              <ul className="timestamp-list">
                {studentInfo.rounds
                  .slice() // Kopie erstellen
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Neueste zuerst
                  .map((round, index, sortedArray) => {
                    const timestamp = round.timestamp;
                    // Finde vorherige Runde (chronologisch früher)
                    const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1].timestamp : null;
                    const timeDifference = calculateTimeDifference(timestamp, previousTimestamp);
                    
                    return (
                      <li key={round.id} className="timestamp-item">
                        <span>
                          {formatDate(new Date(timestamp)) + " Uhr => " + timeAgo(currentTimestamp, new Date(timestamp))}
                          {timeDifference && (
                            <span style={{ color: '#666', marginLeft: '8px', fontSize: '0.9em' }}>
                              (+{timeDifference})
                            </span>
                          )}
                        </span>
                        {authenticated && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTimestamp(round.id)}
                          >
                            Löschen
                          </button>
                        )}
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
