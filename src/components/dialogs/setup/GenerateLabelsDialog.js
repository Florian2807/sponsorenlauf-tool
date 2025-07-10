import React from 'react';

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
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Etiketten generieren</h2>
            <p>Füge Ersatz-IDs hinzu, welche später Schülern zugeordnet werden, welche ihren Zettel verloren haben</p>
            <label>Ersatz-IDs hinzufügen:</label>
            <input
                type="number"
                value={replacementAmount}
                onChange={(e) => setReplacementAmount(e.target.value)}
            />
            <label>Klassen auswählen:</label>
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
        </dialog>
    );
};

export default GenerateLabelsDialog;
