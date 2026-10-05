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
            <form onSubmit={handleSubmit} className="student-add-form">
                <div className="dialog-feature-intro">
                    <span className="ui-icon" aria-hidden="true"><i className="fa-solid fa-user-plus" /></span>
                    <div><h3>Für den Lauf anmelden</h3><p>Trage die Stammdaten ein. Die Schüler-ID wird automatisch vergeben.</p></div>
                    <span className="student-new-id">ID {newStudent.id}</span>
                </div>
                <section className="dialog-form-panel">
                    <h3>Stammdaten</h3>
                    <div className="manage-dialog-form-grid">
                        <div>
                            <label className="form-label" htmlFor="addstudentdialog-field-2">Vorname:</label>
                            <input id="addstudentdialog-field-2" type="text" name="vorname" value={newStudent.vorname}
                                onChange={addStudentChangeField} className="form-input" required autoComplete="given-name" />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="addstudentdialog-field-3">Nachname:</label>
                            <input id="addstudentdialog-field-3" type="text" name="nachname" value={newStudent.nachname}
                                onChange={addStudentChangeField} className="form-input" required autoComplete="family-name" />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="addstudentdialog-field-4">Klasse:</label>
                            <select id="addstudentdialog-field-4" name="klasse" value={newStudent.klasse}
                                onChange={addStudentChangeField} className="form-select" required>
                                <option value="">Klasse auswählen...</option>
                                {availableClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label" htmlFor="addstudentdialog-field-5">Geschlecht:</label>
                            <select id="addstudentdialog-field-5" name="geschlecht" value={newStudent.geschlecht}
                                onChange={addStudentChangeField} className="form-select" required>
                                <option value="männlich">Männlich</option><option value="weiblich">Weiblich</option><option value="divers">Divers</option>
                            </select>
                        </div>
                    </div>
                </section>
            </form>
        </BaseDialog>
    );
};

export default AddStudentDialog;
