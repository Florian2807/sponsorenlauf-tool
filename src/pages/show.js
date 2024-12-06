import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Show.module.css';
import { formatDate, timeAgo } from 'utils/globalFunctions';

export default function Scan() {
  const [id, setID] = useState('');
  const [savedID, setSavedID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.get(`/api/students/${id.replace(new RegExp(`${new Date().getFullYear()}[ß/\\-]`, 'gm'), '')}`);
      if (response.status === 200) {
        setStudentInfo(response.data);
        setCurrentTimestamp(new Date());
        setID('');
        setMessage('');
      } else {
        setID('');
        setStudentInfo(null);
        setMessage('Schüler nicht gefunden');
      }
    } catch (error) {
      setID('');
      setStudentInfo(null);
      setMessage('Schüler nicht gefunden');
    }
  };

  const handleDeleteTimestamp = (selectedStudent, indexToRemove) => {
    const updatedTimestamps = selectedStudent.timestamps.filter((_, index) => index !== indexToRemove);
    axios.put(`/api/students/${savedID.replace(new RegExp(`${new Date().getFullYear()}[ß/\\-]`, 'gm'), '')}`, { timestamps: updatedTimestamps })
      .then(() => {
        setStudentInfo((prevStudentInfo) => ({
          ...prevStudentInfo,
          timestamps: updatedTimestamps,
        }));
      })
      .catch(() => {
        setMessage('Fehler beim Löschen des Zeitstempels');
        setMessageType('error');
      });
  };
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
