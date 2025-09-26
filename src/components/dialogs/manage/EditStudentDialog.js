import React, { useState } from 'react';
import BaseDialog from '../../BaseDialog';
import { formatDate, calculateTimeDifference } from '../../../utils/constants';

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
    editStudent,
    addRound,
    loading = false
}) => {
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleAddRound = () => {
        if (!selectedStudent || !addRound) return;
        
        const currentTimestamp = new Date().toISOString();
        addRound(selectedStudent.id, currentTimestamp);
    };

    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close(),
            disabled: loading
        },
        {
            label: 'Schüler löschen',
            position: 'left',
            variant: 'danger',
            onClick: () => confirmDeletePopup.current.showModal(),
            disabled: loading
        },
        {
            label: loading ? 'Speichere...' : 'Speichern',
            variant: 'success',
            onClick: editStudent,
            disabled: loading || !editForm.vorname || !editForm.nachname
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Schüler bearbeiten"
            actions={actions}
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

            <h3>Ersatz-IDs:</h3>
            <div className="replacement-container">
                {selectedStudent?.replacements.map((replacement, index) => (
                    <div key={index} className="replacement-tag">
                        <span className="replacement-text">{replacement}</span>
                        <button
                            className="delete-replacement-btn"
                            onClick={() => deleteReplacement(replacement)}
                            title="Ersatz-ID löschen"
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

            <div className="rounds-section">
                <div className="rounds-header">
                    <h3>Gelaufene Runden: {selectedStudent?.timestamps.length || 0}</h3>
                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={handleAddRound}
                        disabled={loading}
                    >
                        Runde hinzufügen
                    </button>
                </div>

                <h4>Runden-Timestamps:</h4>
                {selectedStudent?.timestamps && selectedStudent.timestamps.length > 0 ? (
                    <ul className="timestamp-list">
                        {selectedStudent.timestamps
                            .slice() // Kopie erstellen um Original nicht zu mutieren
                            .sort((a, b) => new Date(b) - new Date(a)) // Neueste zuerst
                            .map((timestamp, index, sortedArray) => {
                                // Finde vorherige Runde (chronologisch früher)
                                const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1] : null;
                                const timeDifference = calculateTimeDifference(timestamp, previousTimestamp);
                                
                                return (
                                    <li key={`${timestamp}-${index}`} className="timestamp-item">
                                        <div className="timestamp-info">
                                            <span className="timestamp-date">{formatDate(new Date(timestamp))}</span>
                                            {timeDifference && (
                                                <span className="timestamp-diff">
                                                    (+{timeDifference})
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            className="delete-timestamp-btn"
                                            onClick={() => deleteTimestamp(selectedStudent.timestamps.findIndex(ts => ts === timestamp))}
                                            disabled={loading}
                                            title="Runde löschen"
                                        >
                                            Löschen
                                        </button>
                                    </li>
                                );
                            })}
                    </ul>
                ) : (
                    <div className="no-rounds">
                        <p>Noch keine Runden gelaufen.</p>
                    </div>
                )}
            </div>

        </BaseDialog>
    );
};

export default EditStudentDialog;
