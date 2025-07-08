import React from 'react';
import styles from '../../../styles/Teachers.module.css';

const AddTeacherDialog = ({
    dialogRef,
    newTeacher,
    addTeacherChangeField,
    allPossibleClasses,
    addTeacherSubmit
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Neuen Lehrer hinzufügen</h2>
            <form onSubmit={addTeacherSubmit}>
                <label>ID:</label>
                <input
                    type="text"
                    name="id"
                    value={newTeacher.id}
                    readOnly
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    name="vorname"
                    value={newTeacher.vorname}
                    onChange={addTeacherChangeField}
                    required
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    name="nachname"
                    value={newTeacher.nachname}
                    onChange={addTeacherChangeField}
                    required
                />
                <label>Klasse:</label>
                <select
                    name="klasse"
                    value={newTeacher.klasse || ''}
                    onChange={addTeacherChangeField}
                    className={styles.select}
                >
                    <option value="">Wählen Sie eine Klasse</option>
                    {allPossibleClasses.map((klasse) => (
                        <option key={klasse} value={klasse || ''}>
                            {klasse}
                        </option>
                    ))}
                </select>
                <label>E-Mail Adresse:</label>
                <input
                    type="text"
                    name="email"
                    placeholder="vorname.nachname@schuladresse.de"
                    value={newTeacher.email}
                    onChange={addTeacherChangeField}
                    required
                />
                <div className={styles.popupButtons}>
                    <button className={styles.redButton} onClick={() => dialogRef.current.close()}>
                        Abbrechen
                    </button>
                    <button type="submit">Hinzufügen</button>
                </div>
            </form>
        </dialog>
    );
};

export default AddTeacherDialog;
