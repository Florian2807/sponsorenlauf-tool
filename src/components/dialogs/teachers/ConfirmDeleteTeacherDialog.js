import React from 'react';

const ConfirmDeleteTeacherDialog = ({
    dialogRef,
    deleteTeacher,
    editTeacherPopup
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Bestätigen Sie das Löschen</h2>
            <p>Möchten Sie diesen Lehrer wirklich löschen?</p>
            <div className="dialog-actions">
                <button
                    className="btn btn-secondary"
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
                    className="btn btn-danger"
                >
                    Lehrer löschen
                </button>
            </div>
        </dialog>
    );
};

export default ConfirmDeleteTeacherDialog;
