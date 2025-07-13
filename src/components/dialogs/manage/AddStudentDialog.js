import React from 'react';
import BaseDialog from '../../BaseDialog';

const AddStudentDialog = ({
    dialogRef,
    newStudent,
    addStudentChangeField,
    availableClasses,
    addStudentSubmit,
    loading = false
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        addStudentSubmit(e);
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
            disabled: loading || !newStudent.vorname || !newStudent.nachname
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Neuen Schüler hinzufügen"
            actions={actions}
            size="large"
            showDefaultClose={false}
        >
            <form onSubmit={handleSubmit}>
                <label className="form-label">ID:</label>
                <input
                    type="text"
                    name="id"
                    value={newStudent.id}
                    className="form-input"
                    readOnly
                />

                <label className="form-label">Vorname:</label>
                <input
                    type="text"
                    name="vorname"
                    value={newStudent.vorname}
                    onChange={addStudentChangeField}
                    className="form-input"
                    required
                />

                <label className="form-label">Nachname:</label>
                <input
                    type="text"
                    name="nachname"
                    value={newStudent.nachname}
                    onChange={addStudentChangeField}
                    className="form-input"
                    required
                />

                <label className="form-label">Klasse:</label>
                <select
                    name="klasse"
                    value={newStudent.klasse}
                    onChange={addStudentChangeField}
                    className="form-select"
                    required
                >
                    <option value="">Klasse auswählen...</option>
                    {availableClasses.map((className) => (
                        <option key={className} value={className}>
                            {className}
                        </option>
                    ))}
                </select>

                <label className="form-label">Geschlecht:</label>
                <select
                    name="geschlecht"
                    value={newStudent.geschlecht}
                    onChange={addStudentChangeField}
                    className="form-select"
                    required
                >
                    <option value="männlich">Männlich</option>
                    <option value="weiblich">Weiblich</option>
                    <option value="divers">Divers</option>
                </select>
            </form>
        </BaseDialog>
    );
};

export default AddStudentDialog;
