import React from 'react';
import BaseDialog from '../../BaseDialog';

const AddTeacherDialog = ({
    dialogRef,
    newTeacher,
    addTeacherChangeField,
    allPossibleClasses,
    addTeacherSubmit,
    loading = false
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        addTeacherSubmit(e);
    };

    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close(),
            disabled: loading
        },
        {
            label: loading ? 'Wird hinzugefügt...' : 'Hinzufügen',
            variant: 'success',
            type: 'submit',
            onClick: handleSubmit,
            disabled: loading || !newTeacher.vorname || !newTeacher.nachname
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Neuen Lehrer hinzufügen"
            actions={actions}
            size="large"
            showDefaultClose={false}
        >
            <form onSubmit={handleSubmit}>
                <label className="form-label">ID:</label>
                <input
                    type="text"
                    name="id"
                    value={newTeacher.id}
                    className="form-input"
                    readOnly
                />

                <label className="form-label">Vorname:</label>
                <input
                    type="text"
                    name="vorname"
                    value={newTeacher.vorname}
                    onChange={addTeacherChangeField}
                    className="form-input"
                    required
                />

                <label className="form-label">Nachname:</label>
                <input
                    type="text"
                    name="nachname"
                    value={newTeacher.nachname}
                    onChange={addTeacherChangeField}
                    className="form-input"
                    required
                />

                <label className="form-label">Klasse:</label>
                <select
                    name="klasse"
                    value={newTeacher.klasse || ''}
                    onChange={addTeacherChangeField}
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
                    className="form-input"
                    required
                />
            </form>
        </BaseDialog>
    );
};

export default AddTeacherDialog;
