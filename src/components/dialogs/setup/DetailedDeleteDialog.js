import React, { useState, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { useModuleConfig } from '../../../contexts/ModuleConfigContext';

const DetailedDeleteDialog = ({
    dialogRef,
    onDeleteSuccess
}) => {
    const [selectedOptions, setSelectedOptions] = useState({
        students: false,
        teachers: false,
        rounds: false,
        replacements: false,
        expectedDonations: false,
        receivedDonations: false
    });

    const [confirmChecked, setConfirmChecked] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { isTeachersEnabled } = useModuleConfig();

    // Reset state when dialog opens
    useEffect(() => {
        if (dialogRef.current) {
            const dialog = dialogRef.current;
            const handleShow = () => {
                setSelectedOptions({
                    students: false,
                    teachers: false,
                    rounds: false,
                    replacements: false,
                    expectedDonations: false,
                    receivedDonations: false
                });
                setConfirmChecked(false);
            };
            dialog.addEventListener('show', handleShow);
            return () => dialog.removeEventListener('show', handleShow);
        }
    }, []);

    const handleOptionChange = (option) => {
        setSelectedOptions(prev => {
            const newOptions = { ...prev, [option]: !prev[option] };

            // Wenn Schüler gelöscht werden, müssen auch alle zugehörigen Daten gelöscht werden
            if (option === 'students' && newOptions.students) {
                newOptions.rounds = true;
                newOptions.replacements = true;
                newOptions.expectedDonations = true;
                newOptions.receivedDonations = true;
            }

            return newOptions;
        });
    };

    const getSelectedCount = () => {
        return Object.values(selectedOptions).filter(Boolean).length;
    };

    const getDeleteDescription = () => {
        const selected = Object.keys(selectedOptions).filter(key => selectedOptions[key]);
        if (selected.length === 0) return '';

        const descriptions = {
            students: 'Alle Schüler',
            teachers: 'Alle Lehrer',
            rounds: 'Alle Runden-Daten',
            replacements: 'Alle Ersatz-IDs',
            expectedDonations: 'Alle erwarteten Spenden',
            receivedDonations: 'Alle erhaltenen Spenden'
        };

        return selected.map(key => descriptions[key]).join(', ');
    };

    const isConfirmValid = () => {
        return confirmChecked && getSelectedCount() > 0;
    };

    const handleDelete = async () => {
        if (!isConfirmValid() || isDeleting) return;

        setIsDeleting(true);

        try {
            const deleteOperations = [];
            let deletedItems = [];

            // Reihenfolge ist wichtig: Erst Abhängigkeiten, dann Hauptdaten
            if (selectedOptions.rounds && !selectedOptions.students) {
                deleteOperations.push(
                    request('/api/detailedDelete', {
                        method: 'DELETE',
                        data: { type: 'rounds' }
                    }).then(() => deletedItems.push('Runden-Daten'))
                );
            }

            if (selectedOptions.replacements && !selectedOptions.students) {
                deleteOperations.push(
                    request('/api/detailedDelete', {
                        method: 'DELETE',
                        data: { type: 'replacements' }
                    }).then(() => deletedItems.push('Ersatz-IDs'))
                );
            }

            if (selectedOptions.expectedDonations && !selectedOptions.students) {
                deleteOperations.push(
                    request('/api/detailedDelete', {
                        method: 'DELETE',
                        data: { type: 'expectedDonations' }
                    }).then(() => deletedItems.push('erwartete Spenden'))
                );
            }

            if (selectedOptions.receivedDonations && !selectedOptions.students) {
                deleteOperations.push(
                    request('/api/detailedDelete', {
                        method: 'DELETE',
                        data: { type: 'receivedDonations' }
                    }).then(() => deletedItems.push('erhaltene Spenden'))
                );
            }

            // Lehrer löschen
            if (selectedOptions.teachers) {
                deleteOperations.push(
                    request('/api/deleteAllTeachers', {
                        method: 'DELETE'
                    }).then(() => deletedItems.push('alle Lehrerdaten'))
                );
            }

            // Schüler zuletzt löschen (cascaded alle anderen Daten automatisch)
            if (selectedOptions.students) {
                deleteOperations.push(
                    request('/api/deleteAllStudents', {
                        method: 'DELETE'
                    }).then(() => deletedItems.push('alle Schülerdaten'))
                );
            }

            await Promise.all(deleteOperations);

            const successMessage = deletedItems.length === 1
                ? `${deletedItems[0]} wurden erfolgreich gelöscht.`
                : `Folgende Daten wurden erfolgreich gelöscht: ${deletedItems.join(', ')}.`;

            showSuccess(successMessage, 'Löschvorgang abgeschlossen');

            if (onDeleteSuccess) {
                onDeleteSuccess();
            }

            dialogRef.current.close();

        } catch (error) {
            showError(error, 'Beim Löschen der Daten');
        } finally {
            setIsDeleting(false);
        }
    };

    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close(),
            disabled: isDeleting
        },
        {
            label: isDeleting ? 'Lösche...' : 'Löschen',
            variant: 'danger',
            onClick: handleDelete,
            disabled: !isConfirmValid() || isDeleting
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="🗑️ Detaillierte Löschoptionen"
            actions={actions}
            showDefaultClose={false}
            size="xl"
        >
            <div className="detailed-delete-content">
                <div className="warning-section">
                    <div className="warning-box">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-text">
                            <strong>Achtung:</strong> Diese Aktion kann nicht rückgängig gemacht werden!
                            Bitte wählen Sie sorgfältig aus, welche Daten gelöscht werden sollen.
                        </div>
                    </div>
                </div>

                <div className="delete-options-section">
                    <h3>Zu löschende Daten auswählen:</h3>

                    <div className="delete-options-grid">
                        <label className="delete-option delete-option-critical">
                            <input
                                type="checkbox"
                                checked={selectedOptions.students}
                                onChange={() => handleOptionChange('students')}
                                disabled={isDeleting}
                            />
                            <div className="option-content">
                                <span className="option-icon">👥</span>
                                <div className="option-details">
                                    <span className="option-title">Alle Schüler</span>
                                    <span className="option-description">
                                        <strong>⚠️ Kritisch:</strong> Löscht alle Schülerdaten inkl. aller zugehörigen Runden, Ersatz-IDs und Spenden
                                    </span>
                                </div>
                            </div>
                        </label>

                        {isTeachersEnabled && (
                            <label className="delete-option delete-option-critical">
                                <input
                                    type="checkbox"
                                    checked={selectedOptions.teachers}
                                    onChange={() => handleOptionChange('teachers')}
                                    disabled={isDeleting}
                                />
                                <div className="option-content">
                                    <span className="option-icon">👨‍🏫</span>
                                    <div className="option-details">
                                        <span className="option-title">Alle Lehrer</span>
                                        <span className="option-description">
                                            Löscht alle Lehrerdaten und E-Mail-Zuordnungen
                                        </span>
                                    </div>
                                </div>
                            </label>
                        )}

                        <label className="delete-option delete-option-data" data-disabled={selectedOptions.students}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.rounds}
                                onChange={() => handleOptionChange('rounds')}
                                disabled={selectedOptions.students || isDeleting}
                            />
                            <div className="option-content">
                                <span className="option-icon">🏃‍♂️</span>
                                <div className="option-details">
                                    <span className="option-title">Runden-Daten zurücksetzen</span>
                                    <span className="option-description">
                                        Löscht alle gelaufenen Runden von allen Schülern (Schülerdaten bleiben erhalten)
                                    </span>
                                </div>
                            </div>
                        </label>

                        <label className="delete-option delete-option-data" data-disabled={selectedOptions.students}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.replacements}
                                onChange={() => handleOptionChange('replacements')}
                                disabled={selectedOptions.students || isDeleting}
                            />
                            <div className="option-content">
                                <span className="option-icon">🏷️</span>
                                <div className="option-details">
                                    <span className="option-title">Ersatz-IDs zurücksetzen</span>
                                    <span className="option-description">
                                        Löscht alle generierten Ersatz-IDs von allen Schülern
                                    </span>
                                </div>
                            </div>
                        </label>

                        <label className="delete-option delete-option-financial" data-disabled={selectedOptions.students}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.expectedDonations}
                                onChange={() => handleOptionChange('expectedDonations')}
                                disabled={selectedOptions.students || isDeleting}
                            />
                            <div className="option-content">
                                <span className="option-icon">📋</span>
                                <div className="option-details">
                                    <span className="option-title">Erwartete Spenden zurücksetzen</span>
                                    <span className="option-description">
                                        Löscht alle eingetragenen erwarteten Spendensummen (Soll-Beträge)
                                    </span>
                                </div>
                            </div>
                        </label>

                        <label className="delete-option delete-option-financial" data-disabled={selectedOptions.students}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.receivedDonations}
                                onChange={() => handleOptionChange('receivedDonations')}
                                disabled={selectedOptions.students || isDeleting}
                            />
                            <div className="option-content">
                                <span className="option-icon">💰</span>
                                <div className="option-details">
                                    <span className="option-title">Erhaltene Spenden zurücksetzen</span>
                                    <span className="option-description">
                                        Löscht alle eingetragenen erhaltenen Spendensummen (Ist-Beträge)
                                    </span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {getSelectedCount() > 0 && (
                    <div className="confirmation-section">
                        <div className="selected-summary">
                            <h4>Ausgewählte Löschvorgänge:</h4>
                            <p className="selected-description">{getDeleteDescription()}</p>
                        </div>

                        <div className="confirmation-checkbox">
                            <label className="checkbox-confirm-label">
                                <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    disabled={isDeleting}
                                    className="checkbox-confirm"
                                />
                                <span className="checkbox-text">
                                    Ich bestätige, dass ich diese Daten unwiderruflich löschen möchte
                                </span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .detailed-delete-content {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .warning-section .warning-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
                    border: 1px solid #ffeaa7;
                    border-radius: 12px;
                    color: #856404;
                    box-shadow: 0 2px 8px rgba(255, 234, 167, 0.3);
                }

                [data-theme="dark"] .warning-section .warning-box {
                    background: linear-gradient(135deg, #3d2914, #4a2c00);
                    border-color: #4a2c00;
                    color: #ffab70;
                    box-shadow: 0 2px 8px rgba(77, 44, 0, 0.4);
                }

                .warning-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
                }

                .warning-text {
                    line-height: 1.5;
                }

                .warning-text strong {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 1.1rem;
                }

                .delete-options-section h3 {
                    margin-bottom: 1.5rem;
                    color: var(--text-color);
                    font-size: 1.2rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .delete-options-section h3::before {
                    content: "🎯";
                    font-size: 1.1rem;
                }

                .delete-options-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .delete-option {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1.25rem;
                    border: 2px solid var(--border-color);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: var(--card-background);
                    box-shadow: var(--shadow-sm);
                    position: relative;
                    overflow: hidden;
                }

                /* Spezifische Styling für kritische Option */
                .delete-option-critical {
                    border-left: 4px solid var(--danger-color);
                    background: linear-gradient(135deg, var(--card-background), rgba(244, 67, 54, 0.03));
                }

                [data-theme="dark"] .delete-option-critical {
                    background: linear-gradient(135deg, var(--card-background), rgba(248, 81, 73, 0.08));
                }

                /* Styling für Daten-Optionen */
                .delete-option-data {
                    border-left: 4px solid var(--primary-color);
                    background: linear-gradient(135deg, var(--card-background), rgba(74, 144, 226, 0.03));
                }

                [data-theme="dark"] .delete-option-data {
                    background: linear-gradient(135deg, var(--card-background), rgba(91, 160, 242, 0.08));
                }

                /* Styling für Finanz-Optionen */
                .delete-option-financial {
                    border-left: 4px solid var(--warning-color);
                    background: linear-gradient(135deg, var(--card-background), rgba(230, 126, 34, 0.03));
                }

                [data-theme="dark"] .delete-option-financial {
                    background: linear-gradient(135deg, var(--card-background), rgba(255, 171, 112, 0.08));
                }

                .delete-option::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, var(--danger-color), transparent);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .delete-option-critical:hover:not([data-disabled="true"]) {
                    border-color: var(--danger-color);
                    background: var(--danger-color);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(244, 67, 54, 0.3);
                }

                .delete-option-data:hover:not([data-disabled="true"]) {
                    border-color: var(--primary-color);
                    background: var(--primary-color);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(74, 144, 226, 0.3);
                }

                .delete-option-financial:hover:not([data-disabled="true"]) {
                    border-color: var(--warning-color);
                    background: var(--warning-color);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(230, 126, 34, 0.3);
                }

                .delete-option:hover:not([data-disabled="true"])::before {
                    opacity: 1;
                }

                .delete-option:hover:not([data-disabled="true"]) .option-title,
                .delete-option:hover:not([data-disabled="true"]) .option-description {
                    color: white;
                }

                .delete-option[data-disabled="true"] {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: var(--background-light);
                    border-color: var(--border-light);
                    transform: none;
                }

                .delete-option input[type="checkbox"] {
                    margin: 0.25rem 0 0 0;
                    flex-shrink: 0;
                    width: 18px;
                    height: 18px;
                    accent-color: var(--danger-color);
                }

                .option-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    flex: 1;
                }

                .option-icon {
                    font-size: 2rem;
                    flex-shrink: 0;
                    margin-top: -0.25rem;
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
                }

                .option-details {
                    flex: 1;
                }

                .option-title {
                    display: block;
                    font-weight: 700;
                    color: var(--text-color);
                    margin-bottom: 0.5rem;
                    font-size: 1.1rem;
                    transition: color 0.3s ease;
                }

                .option-description {
                    display: block;
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    line-height: 1.5;
                    transition: color 0.3s ease;
                }

                .confirmation-section {
                    border-top: 2px solid var(--border-color);
                    padding-top: 2rem;
                    background: var(--background-light);
                    border-radius: 12px;
                    padding: 2rem;
                    margin-top: 1rem;
                }

                .selected-summary {
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, #fee, #fdd);
                    border: 1px solid #fbb;
                    border-radius: 8px;
                }

                [data-theme="dark"] .selected-summary {
                    background: linear-gradient(135deg, #2d1b1b, #3d1f1f);
                    border-color: #4a2525;
                }

                .selected-summary h4 {
                    margin-bottom: 0.75rem;
                    color: var(--danger-color);
                    font-size: 1.1rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .selected-summary h4::before {
                    content: "⚠️";
                }

                .selected-description {
                    color: var(--text-muted);
                    margin: 0;
                    font-weight: 500;
                }

                .confirmation-checkbox {
                    background: var(--card-background);
                    padding: 1.25rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }

                .checkbox-confirm-label {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .checkbox-confirm-label:hover {
                    opacity: 0.8;
                }

                .checkbox-confirm {
                    margin: 0;
                    width: 20px;
                    height: 20px;
                    min-width: 20px;
                    accent-color: var(--danger-color);
                    cursor: pointer;
                }

                .checkbox-text {
                    font-size: 1rem;
                    font-weight: 500;
                    color: var(--text-color);
                    line-height: 1.4;
                    user-select: none;
                }

                /* Responsive Design */
                @media (min-width: 768px) {
                    .delete-options-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 1.25rem;
                    }
                    
                    .detailed-delete-content {
                        gap: 2.5rem;
                    }
                }

                @media (min-width: 1024px) {
                    .confirmation-section {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2rem;
                        align-items: start;
                    }
                }

                /* Animationen */
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .delete-option {
                    animation: slideIn 0.3s ease-out;
                }

                .delete-option:nth-child(1) { animation-delay: 0.1s; }
                .delete-option:nth-child(2) { animation-delay: 0.2s; }
                .delete-option:nth-child(3) { animation-delay: 0.3s; }
                .delete-option:nth-child(4) { animation-delay: 0.4s; }
                .delete-option:nth-child(5) { animation-delay: 0.5s; }
            `}</style>
        </BaseDialog>
    );
};

export default DetailedDeleteDialog;
