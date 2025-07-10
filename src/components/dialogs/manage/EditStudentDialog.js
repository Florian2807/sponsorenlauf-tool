import React from 'react';
import BaseDialog from '../../BaseDialog';
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

    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Schüler löschen',
            position: 'left',
            variant: 'danger',
            onClick: () => confirmDeletePopup.current.showModal()
        },
        {
            label: 'Speichern',
            variant: 'success',
            onClick: editStudent
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Schüler bearbeiten"
            actions={actions}
            actionLayout="split"
            size="large"
            showDefaultClose={false}
        >
            <div>
                <label className="form-label">ID:</label>
                <input
                    type="text"
                    value={selectedStudent?.id || ''}
                    className="form-input"
                    disabled
                />

                <label className="form-label">Vorname:</label>
                <input
                    type="text"
                    value={editForm.vorname}
                    onChange={(e) => handleInputChange('vorname', e.target.value)}
                    className="form-input"
                />

                <label className="form-label">Nachname:</label>
                <input
                    type="text"
                    value={editForm.nachname}
                    onChange={(e) => handleInputChange('nachname', e.target.value)}
                    className="form-input"
                />

                <label className="form-label">Klasse:</label>
                <select
                    value={editForm.klasse}
                    onChange={(e) => handleInputChange('klasse', e.target.value)}
                    className="form-select"
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
                    value={editForm.geschlecht}
                    onChange={(e) => handleInputChange('geschlecht', e.target.value)}
                    className="form-select"
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

        </BaseDialog>
    );
};

export default EditStudentDialog;
