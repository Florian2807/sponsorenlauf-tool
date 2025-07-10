import React from 'react';

const EditTeacherDialog = ({
    dialogRef,
    selectedTeacher,
    editVorname,
    setEditVorname,
    editNachname,
    setEditNachname,
    editKlasse,
    setEditKlasse,
    editEmail,
    setEditEmail,
    allPossibleClasses,
    confirmDeletePopup,
    editTeacher
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>

            <div>
                <h2>Lehrer bearbeiten</h2>
                <label>ID:</label>
                <input
                    type="text"
                    value={selectedTeacher?.id || ''}
                    disabled
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    value={editVorname || ''}
                    onChange={(e) => setEditVorname(e.target.value)}
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    value={editNachname || ''}
                    onChange={(e) => setEditNachname(e.target.value)}
                />
                <label>Klasse:</label>
                <select
                    value={editKlasse || ''}
                    onChange={(e) => setEditKlasse(e.target.value)}
                >
                    <option value="">Wählen Sie eine Klasse</option>
                    {allPossibleClasses.map((klasse) => (
                        <option key={klasse} value={klasse}>
                            {klasse}
                        </option>
                    ))}
                </select>
                <label>E-Mail Adresse:</label>
                <input
                    type="email"
                    placeholder="vorname.nachname@schuladresse.de"
                    value={editEmail || ''}
                    onChange={(e) => setEditEmail(e.target.value)}
                />
            </div>

            <div className="dialog-actions">
                <button
                    className="btn btn-danger"
                    onClick={() => confirmDeletePopup.current.showModal()}
                >
                    Lehrer löschen
                </button>
                <button className="btn btn-primary" onClick={editTeacher}>Speichern</button>
            </div>
        </dialog>
    );
};

export default EditTeacherDialog;
