import React from 'react';
import { formatDate } from '../../../utils/constants';

const EditStudentDialog = ({
    dialogRef,
    selectedStudent,
    editForm,
    setEditForm,
    availableClasses,
    deleteTimestamp,
    deleteReplacement,
    setMessage,
    setNewReplacement,
    addReplacementPopup,
    confirmDeletePopup,
    editStudent
}) => {
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>

            <div>
                <h2>Schüler bearbeiten</h2>
                <label>ID:</label>
                <input
                    type="text"
                    value={selectedStudent?.id || ''}
                    disabled
                />
                <label>Vorname:</label>
                <input
                    type="text"
                    value={editForm.vorname}
                    onChange={(e) => handleInputChange('vorname', e.target.value)}
                />
                <label>Nachname:</label>
                <input
                    type="text"
                    value={editForm.nachname}
                    onChange={(e) => handleInputChange('nachname', e.target.value)}
                />
                <label>Klasse:</label>
                <select
                    value={editForm.klasse}
                    onChange={(e) => handleInputChange('klasse', e.target.value)}
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
                    value={editForm.geschlecht}
                    onChange={(e) => handleInputChange('geschlecht', e.target.value)}
                >
                    <option value="männlich">Männlich</option>
                    <option value="weiblich">Weiblich</option>
                    <option value="divers">Divers</option>
                </select>
            </div>

            <div>
                <h3>Gelaufene Runden: {selectedStudent?.timestamps.length}</h3>
                <h3>Timestamps:</h3>
                <ul className="timestamp-list">
                    {selectedStudent?.timestamps.map((timestamp, index) => (
                        <li key={index} className="timestamp-item">
                            <span>{formatDate(new Date(timestamp))}</span>
                            <button
                                className="delete-timestamp-btn"
                                onClick={() => deleteTimestamp(index)}
                            >
                                Löschen
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <h3>Ersatz-IDs:</h3>
            <div className="replacement-container">
                {selectedStudent?.replacements.map((replacement, index) => (
                    <div key={index} className="replacement-tag">
                        <span className="replacement-text">{replacement}</span>
                        <button
                            className="delete-replacement-btn"
                            onClick={() => deleteReplacement(index)}
                        >
                            <span className="delete-icon">&times;</span>
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="replacement-tag"
                    onClick={() => {
                        setMessage('');
                        setNewReplacement('');
                        addReplacementPopup.current.showModal()
                    }}
                >
                    ➕
                </button>
            </div>

            <div className="dialog-actions">
                <button
                    className="btn btn-danger"
                    onClick={() => confirmDeletePopup.current.showModal()}
                >
                    Schüler löschen
                </button>
                <button className="btn btn-primary" onClick={editStudent}>Speichern</button>
            </div>
        </dialog>
    );
};

export default EditStudentDialog;
