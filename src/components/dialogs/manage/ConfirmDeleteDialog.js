import React from 'react';
import styles from '../../../styles/Manage.module.css';

const ConfirmDeleteDialog = ({
    dialogRef,
    deleteStudent,
    editStudentPopup
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Bestätigen Sie das Löschen</h2>
            <p>Möchten Sie diesen Schüler wirklich löschen?</p>
            <div className={styles.popupButtons}>
                <button
                    onClick={() => dialogRef.current.close()}
                >
                    Abbrechen
                </button>
                <button
                    onClick={() => {
                        deleteStudent();
                        dialogRef.current.close();
                        editStudentPopup.current.close();
                    }}
                    className={styles.redButton}
                >
                    Schüler löschen
                </button>
            </div>
        </dialog>
    );
};

export default ConfirmDeleteDialog;
