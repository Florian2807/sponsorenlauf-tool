import React from 'react';
import BaseDialog from '../../BaseDialog';

const GenerateLabelsDialog = ({
    dialogRef,
    replacementAmount,
    setReplacementAmount,
    handleSelectAll,
    handleDeselectAll,
    classes,
    selectedClasses,
    handleClassSelection,
    message,
    loading,
    handleGenerateLabels
}) => {
    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: loading.labels ? 'Generiere...' : 'Generieren',
            variant: 'success',
            position: 'right',
            onClick: handleGenerateLabels,
            disabled: loading.labels || (selectedClasses.length === 0 && replacementAmount <= 0)
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Etiketten generieren"
            actions={actions}
            actionLayout="split"
            size="large"
            showDefaultClose={false}
        >
            <p>Füge Ersatz-IDs hinzu, welche später Schülern zugeordnet werden, welche ihren Zettel verloren haben</p>

            <div className="form-group">
                <label className="form-label">Ersatz-IDs hinzufügen:</label>
                <input
                    type="number"
                    value={replacementAmount}
                    onChange={(e) => setReplacementAmount(e.target.value)}
                    className="form-input"
                    min="0"
                    placeholder="Anzahl Ersatz-Etiketten"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Klassen auswählen:</label>
                
                <div className="select-buttons">
                    <button onClick={handleSelectAll} className="btn btn-secondary btn-sm">
                        Alle auswählen
                    </button>
                    <button onClick={handleDeselectAll} className="btn btn-secondary btn-sm">
                        Alle abwählen
                    </button>
                </div>
                
                <div className="class-selection-grid">
                    {replacementAmount > 0 && (
                        <div className="class-checkbox-item class-checkbox-item-replacement">
                            <input
                                type="checkbox"
                                id="ersatz-checkbox"
                                checked={true}
                                disabled={true}
                                className="class-checkbox"
                            />
                            <label htmlFor="ersatz-checkbox" className="class-checkbox-label">
                                <span className="class-name">Ersatz</span>
                                <span className="class-count">({replacementAmount})</span>
                            </label>
                        </div>
                    )}

                    {classes.map((klasse) => (
                        <div key={klasse} className="class-checkbox-item">
                            <input
                                type="checkbox"
                                id={`class-${klasse}`}
                                value={klasse}
                                checked={selectedClasses.includes(klasse)}
                                onChange={handleClassSelection}
                                className="class-checkbox"
                            />
                            <label htmlFor={`class-${klasse}`} className="class-checkbox-label">
                                <span className="class-name">{klasse}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            {message.download && (
                <div className="alert alert-success">
                    {message.download}
                </div>
            )}
            
            {loading.labels && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <span>Etiketten werden generiert...</span>
                </div>
            )}
        </BaseDialog>
    );
};

export default GenerateLabelsDialog;
