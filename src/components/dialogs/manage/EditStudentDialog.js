import React from 'react';
import { formatDate } from '/utils/globalFunctions';
import styles from '../../../styles/Manage.module.css';

const EditStudentDialog = ({
    dialogRef,
    selectedStudent,
    editVorname,
    setEditVorname,
    editNachname,
    setEditNachname,
    editKlasse,
    setEditKlasse,
    availableClasses,
    deleteTimestamp,
    deleteReplacement,
    setMessage,
    setNewReplacement,
    addReplacementPopup,
    confirmDeletePopup,
    editStudent
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>

            <div>
                <h2>Schüler bearbeiten</h2>
                <label>ID:</label>
                <input
                    type="text"
                    value={selectedStudent?.id}
                    disabled
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    value={editVorname}
                    onChange={(e) => setEditVorname(e.target.value)}
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    value={editNachname}
                    onChange={(e) => setEditNachname(e.target.value)}
                />
                <label>Klasse:</label>
                <select
                    value={editKlasse}
                    onChange={(e) => setEditKlasse(e.target.value)}
                    className={styles.select}
                >
                    <option value="">Klasse auswählen...</option>
                    {availableClasses.map((className) => (
                        <option key={className} value={className}>
                            {className}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <h3>Gelaufene Runden: {selectedStudent?.timestamps.length}</h3>
                <h3>Timestamps:</h3>
                <ul className={styles.timestampList}>
                    {selectedStudent?.timestamps.map((timestamp, index) => (
                        <li key={index} className={styles.timestampItem}>
                            <span>{formatDate(new Date(timestamp))}</span>
                            <button
                                className={styles.deleteTimestampButton}
                                onClick={() => deleteTimestamp(index)}
                            >
                                Löschen
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <h3>Ersatz-IDs:</h3>
            <div className={styles.replacementContainer}>
                {selectedStudent?.replacements.map((replacement, index) => (
                    <div key={index} className={styles.replacementTag}>
                        <span className={styles.replacementText}>{replacement}</span>
                        <button
                            className={styles.deleteReplacementButton}
                            onClick={() => deleteReplacement(index)}
                        >
                            <span className={styles.deleteIcon}>&times;</span>
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className={styles.replacementTag}
                    onClick={() => {
                        setMessage('');
                        setNewReplacement('');
                        addReplacementPopup.current.showModal()
                    }}
                >
                    ➕
                </button>
            </div>

            <div className={styles.popupButtons}>
                <button
                    className={styles.redButton}
                    onClick={() => confirmDeletePopup.current.showModal()}
                >
                    Schüler löschen
                </button>
                <button onClick={editStudent}>Speichern</button>
            </div>
        </dialog>
    );
};

export default EditStudentDialog;
