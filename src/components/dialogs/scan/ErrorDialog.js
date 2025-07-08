import React from 'react';
import styles from '../../../styles/Scan.module.css';

const ErrorDialog = ({ dialogRef }) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Fehler</h2>
            <p>Klicke auf das Eingabefeld, damit die Daten in die Datenbank aufgenommen werden können!</p>
            <div className={styles.popupButtons}>
                <button onClick={() => dialogRef.current.close()}>Schließen</button>
            </div>
        </dialog>
    );
};

export default ErrorDialog;
