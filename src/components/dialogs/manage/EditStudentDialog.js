import React from 'react';
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
        
        addRound(selectedStudent.id);
    };

    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close(),
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
            className="edit-student-dialog"
            showDefaultClose={false}
        >
            <div className="manage-dialog-stack">
                <div className="student-editor-identity">
                    <span className="student-profile-avatar" aria-hidden="true">{selectedStudent?.vorname?.[0]}{selectedStudent?.nachname?.[0]}</span>
                    <div><strong>{selectedStudent?.vorname} {selectedStudent?.nachname}</strong><span>ID {selectedStudent?.id} · {selectedStudent?.timestamps.length || 0} Runden</span></div>
                </div>

                <section className="manage-dialog-section">
                    <div className="manage-dialog-section-header">
                        <h3>Stammdaten</h3>
                        <p>Name, Klasse und Geschlecht ändern.</p>
                    </div>

                    <div className="manage-dialog-form-grid">
                        <div>
                            <label className="form-label" htmlFor="editstudentdialog-field-3">Vorname</label>
                            <input id="editstudentdialog-field-3"
                                type="text"
                                value={editForm.vorname}
                                onChange={(e) => handleInputChange('vorname', e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="editstudentdialog-field-4">Nachname</label>
                            <input id="editstudentdialog-field-4"
                                type="text"
                                value={editForm.nachname}
                                onChange={(e) => handleInputChange('nachname', e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div>
                            <label className="form-label" htmlFor="editstudentdialog-field-2">Klasse</label>
                            <select id="editstudentdialog-field-2"
                                value={editForm.klasse}
                                onChange={(e) => handleInputChange('klasse', e.target.value)}
                                className="form-select"
                            >
                                <option value="">Klasse auswählen...</option>
                                {availableClasses.map((className) => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label" htmlFor="editstudentdialog-field-5">Geschlecht</label>
                            <select id="editstudentdialog-field-5"
                                value={editForm.geschlecht}
                                onChange={(e) => handleInputChange('geschlecht', e.target.value)}
                                className="form-select"
                            >
                                <option value="männlich">Männlich</option>
                                <option value="weiblich">Weiblich</option>
                                <option value="divers">Divers</option>
                            </select>
                        </div>
                    </div>
                </section>

                <details className="manage-dialog-section student-editor-details">
                    <summary>Ersatz-IDs <span>{selectedStudent?.replacements?.length || 0}</span></summary>
                    <div className="manage-dialog-section-header manage-dialog-section-header-inline">
                        <div>
                            <h3 className="sr-only">Ersatz-IDs</h3>
                            <p>Alternative Barcodes für verlorene Laufkarten.</p>
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                setMessage('');
                                setNewReplacement('');
                                addReplacementPopup.current.showModal();
                            }}
                        >
                            Ersatz-ID hinzufügen
                        </button>
                    </div>

                    {selectedStudent?.replacements.length ? (
                        <div className="replacement-container">
                            {selectedStudent.replacements.map((replacement, index) => (
                                <div key={index} className="replacement-tag">
                                    <span className="replacement-text">{replacement}</span>
                                    <button
                                        className="delete-replacement-btn"
                                        onClick={() => deleteReplacement(replacement)}
                                        title="Ersatz-ID löschen"
                                        aria-label={`Ersatz-ID ${replacement} löschen`}
                                    >
                                        <span className="delete-icon">&times;</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">Noch keine Ersatz-IDs vorhanden.</div>
                    )}
                </details>

                <details className="manage-dialog-section rounds-section student-editor-details">
                <summary>Rundenverlauf <span>{selectedStudent?.timestamps.length || 0}</span></summary>
                <div className="rounds-header">
                    <div>
                        <h3 className="sr-only">Runden</h3>
                        <p className="text-muted">Gelaufene Runden: {selectedStudent?.timestamps.length || 0}</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddRound}
                        disabled={loading}
                    >
                        Runde hinzufügen
                    </button>
                </div>

                {selectedStudent?.rounds && selectedStudent.rounds.length > 0 ? (
                    <ul className="timestamp-list">
                        {selectedStudent.rounds
                            .slice() // Kopie erstellen um Original nicht zu mutieren
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Neueste zuerst
                            .map((round, index, sortedArray) => {
                                const timestamp = round.timestamp;
                                // Finde vorherige Runde (chronologisch früher)
                                const previousTimestamp = index < sortedArray.length - 1 ? sortedArray[index + 1].timestamp : null;
                                const timeDifference = calculateTimeDifference(timestamp, previousTimestamp);
                                
                                return (
                                    <li key={round.id} className="timestamp-item">
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
                                            onClick={() => deleteTimestamp(round.id)}
                                            disabled={loading}
                                            title="Runde löschen"
                                            aria-label={`Runde ${sortedArray.length - index} löschen`}
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
                </details>
                <details className="student-delete-section">
                    <summary>Schüler löschen</summary>
                    <div className="student-delete-content">
                        <p>Entfernt den Schüler und seine Runden. Vor dem Löschen wird eine Sicherheitskopie erstellt.</p>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => confirmDeletePopup.current.showModal()} disabled={loading}>
                            Schüler löschen
                        </button>
                    </div>
                </details>
            </div>

        </BaseDialog>
    );
};

export default EditStudentDialog;
