import React from 'react';
import styles from '../../../styles/Teachers.module.css';

const ConfirmDeleteTeacherDialog = ({
    dialogRef,
    deleteTeacher,
    editTeacherPopup
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Bestätigen Sie das Löschen</h2>
            <p>Möchten Sie diesen Lehrer wirklich löschen?</p>
            <div className={styles.popupButtons}>
                <button
                    onClick={() => dialogRef.current.close()}
                >
                    Abbrechen
                </button>
                <button
                    onClick={() => {
                        deleteTeacher();
                        dialogRef.current.close();
                        editTeacherPopup.current.close();
                    }}
                    className={styles.redButton}
                >
                    Lehrer löschen
                </button>
            </div>
        </dialog>
    );
};

export default ConfirmDeleteTeacherDialog;
