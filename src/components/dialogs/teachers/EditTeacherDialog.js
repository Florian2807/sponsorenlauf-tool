import React from 'react';
import BaseDialog from '../../BaseDialog';

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
    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Lehrer löschen',
            variant: 'danger',
            position: 'left',
            onClick: () => confirmDeletePopup.current.showModal()
        },
        {
            label: 'Speichern',
            variant: 'success',
            onClick: editTeacher
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Lehrer bearbeiten"
            actions={actions}
            size="large"
            showDefaultClose={false}
        >
            <div className="form-group">
                <label className="form-label">ID:</label>
                <input
                    type="text"
                    value={selectedTeacher?.id || ''}
                    disabled
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Vorname:</label>
                <input
                    type="text"
                    value={editVorname || ''}
                    onChange={(e) => setEditVorname(e.target.value)}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Nachname:</label>
                <input
                    type="text"
                    value={editNachname || ''}
                    onChange={(e) => setEditNachname(e.target.value)}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Klasse:</label>
                <select
                    value={editKlasse || ''}
                    onChange={(e) => setEditKlasse(e.target.value)}
                    className="form-select"
                >
                    <option value="">Wählen Sie eine Klasse</option>
                    {allPossibleClasses.map((klasse) => (
                        <option key={klasse} value={klasse}>
                            {klasse}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">E-Mail Adresse:</label>
                <input
                    type="email"
                    placeholder="vorname.nachname@schuladresse.de"
                    value={editEmail || ''}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="form-input"
                />
            </div>
        </BaseDialog>
    );
};

export default EditTeacherDialog;
