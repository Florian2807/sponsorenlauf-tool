import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Scan.module.css'; // Importiere die CSS-Datei
import { formatDate, timeAgo } from 'utils/globalFunctions';

export default function Scan() {
  const [id, setID] = useState('');
  const [savedID, setSavedID] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // Track the message type
  const [studentInfo, setStudentInfo] = useState(null);
  const [showEnterPopup, setShowEnterPopup] = useState(false); // Status für das Enter-Popup
  const inputRef = useRef(null); // Referenz für das Eingabefeld

  // Fokussiere das Eingabefeld beim Laden der Komponente
  useEffect(() => {
    inputRef.current.focus();

    // Event-Listener für Tastatureingaben
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && document.activeElement !== inputRef.current) {
        event.preventDefault(); // Verhindert das Standardverhalten
        setShowEnterPopup(true); // Zeige das Enter-Popup an
      }
    };

    // Cleanup des Event-Listeners
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value; // Neuen Wert aus dem Eingabefeld
    setID(newValue); // Aktualisiere den ID-Status
    setSavedID(newValue); // Speichere den neuen Wert
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Verhindert das Standard-Formular-Submit-Verhalten

    try {
      const response = await axios.post('/api/runden', { id: id.replace(/2024[ß\/\-]/gm, ''), date: new Date() });

      if (response.data.success) {
        setMessage('Runde erfolgreich gezählt!');
        setMessageType('success'); // Set message type to success
        // Fetch student information based on ID
        const studentResponse = await axios.get(`/api/students/${id.replace(/2024[ß\/\-]/gm, '')}`);
        setStudentInfo(studentResponse.data);
        setCurrentTimestamp(new Date());
        setID(''); // Leere das Eingabefeld nach erfolgreichem Scannen
      } else {
        setID('');
        setMessage('Fehler beim Scannen der Runde');
        setMessageType('error'); // Set message type to error
        setStudentInfo(null);
      }
    } catch (error) {
      setID('');
      if (error.response?.status === 404) {
        setMessage('Datensatz nicht gefunden');
        setMessageType('error'); // Set message type to error
      } else {
        setMessage('Fehler beim Scannen der Runde');
        setMessageType('error'); // Set message type to error
      }
      setStudentInfo(null);
    }
  };

  const handleDeleteTimestamp = (selectedStudent, indexToRemove) => {
    const updatedTimestamps = selectedStudent.timestamps.filter((_, index) => index !== indexToRemove);
    axios.put(`/api/students/${savedID.replace(/2024[ß\/\-]/gm, '')}`, { timestamps: updatedTimestamps })
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

  const closeEnterPopup = () => {
    setShowEnterPopup(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sponsorenlauf 2024</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          ref={inputRef}  // Referenz für das Eingabefeld
          value={id}
          onChange={handleInputChange} // Handle input change
          placeholder="Barcode scannen"
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>Runde zählen</button>
      </form>

      {/* Enter-Popup */}
      {showEnterPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <button className={styles.closeButton} onClick={closeEnterPopup}>X</button>
            <h2>Fehler</h2>
            <p>Klicke auf das Eingabefeld, damit die Daten in die Datenbank aufgenommen werden können!</p>
            <div className={styles.popupButtons}>
              <button type="button" className={styles.saveButton} onClick={closeEnterPopup}>Schließen</button>
            </div>
          </div>
        </div>
      )}

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
