import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatDate, timeAgo, calculateTimeDifference } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { cleanScannedStudentId } from '../utils/studentId';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function Show() {
  const [id, setID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const { request, loading } = useApi();
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
    if (!cleanedId || loading) return;

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
  }, [id, cleanId, request, showError, loading]);

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

  const rounds = (studentInfo?.rounds || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="app-page show-page">
      <div className="student-page-heading">
        <div>
          <h1 className="page-title">Schüler anzeigen</h1>
          <p className="student-page-description">Runden und Schülerdaten nachschlagen, ohne eine Runde zu zählen.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="student-lookup ui-surface" data-tour="show">
        <div className="student-lookup-field">
          <label className="form-label" htmlFor="show-id">Barcode oder Schüler-ID</label>
          <input id="show-id" type="text" ref={inputRef} value={id}
            onChange={(e) => setID(e.target.value)} placeholder="Barcode scannen oder ID eingeben"
            required className="form-control" autoComplete="off" readOnly={loading} />
        </div>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Lädt…' : 'Anzeigen'}</button>
      </form>

      {studentInfo ? (
        <div className="student-info student-profile" aria-live="polite">
          <div className="student-profile-heading">
            <span className="student-profile-avatar" aria-hidden="true">{studentInfo.vorname?.[0]}{studentInfo.nachname?.[0]}</span>
            <div className="student-profile-name">
              <h2>{studentInfo.vorname} {studentInfo.nachname}</h2>
              <span>Klasse {studentInfo.klasse || '–'} · ID {studentInfo.id}</span>
            </div>
            {authenticated && (
              <Link href={{ pathname: '/manage', query: { student: studentInfo.id } }} className="btn btn-secondary"
                aria-label={`${studentInfo.vorname} ${studentInfo.nachname} bearbeiten`}>
                <i className="fa-solid fa-pen" aria-hidden="true" /> Schüler bearbeiten
              </Link>
            )}
          </div>
          <div className="student-profile-facts">
            <div><span>Gelaufene Runden</span><strong>{rounds.length}</strong></div>
            <div><span>Letzter Scan</span><strong>{rounds[0] ? new Date(rounds[0].timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : 'Noch kein Scan'}</strong></div>
            <div><span>Geschlecht</span><strong>{studentInfo.geschlecht || 'Nicht angegeben'}</strong></div>
          </div>
          <section className="student-rounds-section">
            <div className="student-section-heading"><h3>Rundenverlauf</h3><span>Neueste zuerst</span></div>
            {rounds.length ? (
              <ol className="timestamp-list student-rounds-list">
                {rounds.map((round, index) => {
                  const timestamp = round.timestamp;
                  const previousTimestamp = rounds[index + 1]?.timestamp;
                  const timeDifference = calculateTimeDifference(timestamp, previousTimestamp);
                  return (
                    <li key={round.id} className="timestamp-item">
                      <span className="round-number">{rounds.length - index}</span>
                      <div className="student-round-detail">
                        <strong>{formatDate(new Date(timestamp))} Uhr</strong>
                        <span>{timeAgo(currentTimestamp, new Date(timestamp))}{timeDifference ? ` · Abstand: ${timeDifference}` : ''}</span>
                      </div>
                      {authenticated && (
                        <button type="button" className="btn btn-danger btn-sm" aria-label={`Runde ${rounds.length - index} löschen`}
                          onClick={() => handleDeleteTimestamp(round.id)} disabled={loading}>Löschen</button>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : <p className="student-empty-copy">Für diesen Schüler wurden noch keine Runden erfasst.</p>}
          </section>
        </div>
      ) : (
        <div className="student-lookup-empty ui-surface">
          <span className="ui-icon" aria-hidden="true"><i className="fa-solid fa-address-card" /></span>
          <h2>Wen möchtest du anzeigen?</h2>
          <p>Scanne die Laufkarte oder gib die Schüler-ID ein.</p>
        </div>
      )}
    </div>
  );
}
