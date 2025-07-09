import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/Show.module.css';
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
    <div className={styles.container}>
      <h1 className={styles.title}>Schüler anzeigen</h1>
      <p className={styles.warning}>Achtung: Hier werden keine Runden hinzugefügt, nur die Schülerdaten angezeigt.</p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          ref={inputRef}
          value={id}
          onChange={(e) => { setSavedID(e.target.value); setID(e.target.value) }}
          placeholder="Barcode scannen"
          required
          className={styles.input}
        />
        <button type="submit">Anzeigen</button>
      </form>
      {message && (
        <p className={`${styles.message} ${styles[messageType]}`}>{message}</p>
      )}
      {studentInfo && (
        <div className={styles.studentInfo}>
          <h2>Schüler-Informationen</h2>
          <p><strong>Klasse:</strong> {studentInfo.klasse}</p>
          <p><strong>Name:</strong> {studentInfo.vorname} {studentInfo.nachname}</p>
          <p><strong>Geschlecht:</strong> {studentInfo.geschlecht || 'Nicht angegeben'}</p>
          <p><strong>Gelaufene Runden:</strong> {studentInfo.timestamps.length}</p>

          {studentInfo.timestamps && studentInfo.timestamps.length > 0 && (
            <div className={styles.timestamps}>
              <h3>Scan-Timestamps:</h3>
              <ul className={styles.timestampList}>
                {studentInfo.timestamps.map((timestamp, index) => (
                  <li key={index} className={styles.timestampItem}>
                    <span>{formatDate(new Date(timestamp)) + " Uhr => " + timeAgo(currentTimestamp, new Date(timestamp))}</span>
                    <button
                      type="button"
                      className={styles.deleteTimestampButton}
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