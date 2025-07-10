import React from 'react';

const AddTeacherDialog = ({
    dialogRef,
    newTeacher,
    addTeacherChangeField,
    allPossibleClasses,
    addTeacherSubmit
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Neuen Lehrer hinzufügen</h2>
            <form onSubmit={addTeacherSubmit}>
                <label>ID:</label>
                <input
                    type="text"
                    name="id"
                    value={newTeacher.id}
                    readOnly
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    name="vorname"
                    value={newTeacher.vorname}
                    onChange={addTeacherChangeField}
                    required
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    name="nachname"
                    value={newTeacher.nachname}
                    onChange={addTeacherChangeField}
                    required
                />
                <label>Klasse:</label>
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
                    required
                />
                <div className="dialog-actions">
                    <button className="btn btn-secondary" onClick={() => dialogRef.current.close()}>
                        Abbrechen
                    </button>
                    <button type="submit" className="btn btn-primary">Hinzufügen</button>
                </div>
            </form>
        </dialog>
    );
};

export default AddTeacherDialog;
