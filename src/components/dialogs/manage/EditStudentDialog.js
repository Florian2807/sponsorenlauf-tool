import React from 'react';
import { formatDate } from '../../../utils/constants';
import styles from '../../../styles/Manage.module.css';

const EditStudentDialog = ({
    dialogRef,
    selectedStudent,
    editForm,
    setEditForm,
    availableClasses,
    deleteTimestamp,
    deleteReplacement,
    setMessage,
    setNewReplacement,
    addReplacementPopup,
    confirmDeletePopup,
    editStudent
}) => {
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

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
                    value={selectedStudent?.id || ''}
                    disabled
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    value={editForm.vorname}
                    onChange={(e) => handleInputChange('vorname', e.target.value)}
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    value={editForm.nachname}
                    onChange={(e) => handleInputChange('nachname', e.target.value)}
                />
                <label>Klasse:</label>
                <select
                    value={editForm.klasse}
                    onChange={(e) => handleInputChange('klasse', e.target.value)}
                    className={styles.select}
                >
                    <option value="">Klasse auswählen...</option>
                    {availableClasses.map((className) => (
                        <option key={className} value={className}>
                            {className}
                        </option>
                    ))}
                </select>

                <label>Geschlecht:</label>
                <select
                    value={editForm.geschlecht}
                    onChange={(e) => handleInputChange('geschlecht', e.target.value)}
                    className={styles.select}
                >
                    <option value="männlich">Männlich</option>
                    <option value="weiblich">Weiblich</option>
                    <option value="divers">Divers</option>
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
