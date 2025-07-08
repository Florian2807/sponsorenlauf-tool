import React from 'react';
import styles from '../../../styles/Manage.module.css';

const AddReplacementDialog = ({
    dialogRef,
    newReplacement,
    setNewReplacement,
    message,
    addReplacementID
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Ersatz-ID hinzufügen</h2>
            <p>Füge eine Ersatz-ID zum Schüler hinzu</p>
            <input
                type="number"
                name="replacement"
                value={newReplacement}
                onChange={(e) => setNewReplacement(e.target.value)}
                required
            />
            {message && <p className={styles.errorMessage}>{message}</p>}
            <div className={styles.popupButtons}>
                <button
                    onClick={() => dialogRef.current.close()}
                >
                    Abbrechen
                </button>
                <button
                    onClick={addReplacementID}
                >
                    Hinzufügen
                </button>
            </div>
        </dialog>
    );
};

export default AddReplacementDialog;
