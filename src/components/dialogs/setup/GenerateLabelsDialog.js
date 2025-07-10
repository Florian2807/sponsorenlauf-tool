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
            onClick: handleGenerateLabels,
            disabled: loading.labels
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

            <label className="form-label">Ersatz-IDs hinzufügen:</label>
            <input
                type="number"
                value={replacementAmount}
                onChange={(e) => setReplacementAmount(e.target.value)}
                className="form-input"
            />

            <label className="form-label">Klassen auswählen:</label>
            <div className="select-buttons">
                <button onClick={handleSelectAll} className="select-button">Alle auswählen</button>
                <button onClick={handleDeselectAll} className="select-button">Alle abwählen</button>
            </div>

            <div className="class-checkboxes" style={{ color: 'grey' }}>
                <label className="class-select-label">
                    <input
                        type="checkbox"
                        value="Erstatz"
                        checked={replacementAmount > 0}
                        disabled={true}
                        onChange={handleClassSelection}
                    />
                    Ersatz
                </label>
                <div className="new-line"></div>

                {classes.map((klasse, index) => (
                    <React.Fragment key={klasse}>
                        <label className="class-select-label">
                            <input
                                type="checkbox"
                                value={klasse}
                                checked={selectedClasses.includes(klasse)}
                                onChange={handleClassSelection}
                            />
                            {klasse}
                        </label>
                    </React.Fragment>
                ))}
            </div>
            {message.download && <p className="message success">{message.download}</p>}
            {loading.labels && <div className="progress-bar" />}
            <div className="dialog-actions">
                <button
                    onClick={() => dialogRef.current.close()}
                    className="btn btn-secondary"
                >
                    Abbrechen
                </button>
                <button
                    onClick={handleGenerateLabels}
                    disabled={loading.labels}
                    className="btn btn-primary"
                >
                    Generieren
                </button>
            </div>
        </BaseDialog>
    );
};

export default GenerateLabelsDialog;
