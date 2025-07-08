import React from 'react';
import styles from '../../../styles/Manage.module.css';

const AddStudentDialog = ({
    dialogRef,
    newStudent,
    addStudentChangeField,
    availableClasses,
    addStudentSubmit
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Neuen Schüler hinzufügen</h2>
            <form onSubmit={addStudentSubmit}>
                <label>ID:</label>
                <input
                    type="text"
                    name="id"
                    value={newStudent.id}
                    readOnly
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    name="vorname"
                    value={newStudent.vorname}
                    onChange={addStudentChangeField}
                    required
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    name="nachname"
                    value={newStudent.nachname}
                    onChange={addStudentChangeField}
                    required
                />
                <label>Klasse:</label>
                <select
                    name="klasse"
                    value={newStudent.klasse}
                    onChange={addStudentChangeField}
                    className={styles.select}
                    required
                >
                    <option value="">Klasse auswählen...</option>
                    {availableClasses.map((className) => (
                        <option key={className} value={className}>
                            {className}
                        </option>
                    ))}
                </select>
                <div className={styles.popupButtons}>
                    <button className={styles.redButton} onClick={() => dialogRef.current.close()}>Abbrechen</button>
                    <button type="submit">Hinzufügen</button>
                </div>
            </form>
        </dialog>
    );
};

export default AddStudentDialog;
