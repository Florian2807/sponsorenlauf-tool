import React from 'react';
import styles from '../../../styles/Setup.module.css';

const ConfirmDeleteAllDialog = ({
    dialogRef,
    handleDeleteAllStudents
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Bestätigen Sie das Löschen</h2>
            <p>Möchten Sie wirklich alle Schüler löschen?</p>
            <div className={styles.popupButtons}>
                <button
                    onClick={() => dialogRef.current.close()}
                >
                    Abbrechen
                </button>
                <button
                    onClick={handleDeleteAllStudents}
                    className={styles.redButton}
                >
                    Alle löschen
                </button>
            </div>
        </dialog>
    );
};

export default ConfirmDeleteAllDialog;
