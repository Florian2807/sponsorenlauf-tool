import React from 'react';
import BaseDialog from '../../BaseDialog';

const AddStudentDialog = ({
    dialogRef,
    newStudent,
    addStudentChangeField,
    availableClasses,
    addStudentSubmit
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Neuen Schüler hinzufügen</h2>
            <form onSubmit={addStudentSubmit}>
                <label>ID:</label>
                <input
                    type="text"
                    name="id"
                    value={newStudent.id}
                    readOnly
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    name="vorname"
                    value={newStudent.vorname}
                    onChange={addStudentChangeField}
                    required
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    name="nachname"
                    value={newStudent.nachname}
                    onChange={addStudentChangeField}
                    required
                />
                <label>Klasse:</label>
                <select
                    name="klasse"
                    value={newStudent.klasse}
                    onChange={addStudentChangeField}
                    required
                >
                    <option value="">Klasse auswählen...</option>
                    {availableClasses.map((className) => (
                        <option key={className} value={className}>
                            {className}
                        </option>
                    ))}
                </select>

                <label>Geschlecht:</label>
                <select
                    name="geschlecht"
                    value={newStudent.geschlecht}
                    onChange={addStudentChangeField}
                    required
                >
                    <option value="männlich">Männlich</option>
                    <option value="weiblich">Weiblich</option>
                    <option value="divers">Divers</option>
                </select>
                <div className="dialog-actions">
                    <button className="btn btn-secondary" onClick={() => dialogRef.current.close()}>Abbrechen</button>
                    <button type="submit" className="btn btn-primary">Hinzufügen</button>
                </div>
            </form>
        </dialog>
    );
};

export default AddStudentDialog;
