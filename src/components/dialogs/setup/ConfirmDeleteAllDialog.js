import React from 'react';

const ConfirmDeleteAllDialog = ({
    dialogRef,
    handleDeleteAllStudents
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Bestätigen Sie das Löschen</h2>
            <p>Möchten Sie wirklich alle Schüler löschen?</p>
            <div className="dialog-buttons">
                <button
                    onClick={() => dialogRef.current.close()}
                    className="btn btn-secondary"
                >
                    Abbrechen
                </button>
                <button
                    onClick={handleDeleteAllStudents}
                    className="btn btn-danger"
                >
                    Alle löschen
                </button>
            </div>
        </dialog>
    );
};

export default ConfirmDeleteAllDialog;
