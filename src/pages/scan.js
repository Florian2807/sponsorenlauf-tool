import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Scan.module.css';
import { formatDate, timeAgo } from '/utils/globalFunctions';

export default function Scan() {
  const [id, setID] = useState('');
  const [savedID, setSavedID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        popupRef.current.showModal()
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setID(newValue);
    setSavedID(newValue);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post('/api/runden', {
        id: id.replace(new RegExp(`${new Date().getFullYear()}[ß/\\-]`, 'gm'), ''), date: new Date()
      });

      if (response.data.success) {
        const studentResponse = await axios.get(`/api/students/${id.replace(new RegExp(`${new Date().getFullYear()}[ß/\\-]`, 'gm'), '')}`);
        setStudentInfo(studentResponse.data);
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
      if (error.response?.status === 404) {
        setMessage('Datensatz nicht gefunden');
        setMessageType('error');
      } else {
        console.error(error);
        setMessage('Fehler beim speichern der Runde');
        setMessageType('error');
      }
      setStudentInfo(null);
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
      <h1 className={styles.title}>Sponsorenlauf {new Date().getFullYear()}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          ref={inputRef}
          value={id}
          onChange={handleInputChange}
          placeholder="Barcode scannen"
          required
          className={styles.idInput}
        />
        <button type="submit">Runde zählen</button>
      </form>

      {/* Enter-Popup */}
      <dialog ref={popupRef} className={styles.popup}>
        <button className={styles.closeButtonX} onClick={() => popupRef.current.close()}>
          &times;
        </button>
        <h2>Fehler</h2>
        <p>Klicke auf das Eingabefeld, damit die Daten in die Datenbank aufgenommen werden können!</p>
        <div className={styles.popupButtons}>
          <button onClick={() => popupRef.current.close()}>Schließen</button>
        </div>
      </dialog >

      {message && (
        <p className={`${styles.message} ${styles[messageType]}`}>{message}</p>
      )
      }
      {
        studentInfo && (
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
        )
      }
    </div >
  );
}
