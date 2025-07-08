import React from 'react';
import styles from '../../../styles/Setup.module.css';

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
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Etiketten generieren</h2>
            <p>Füge Ersatz-IDs hinzu, welche später Schülern zugeordnet werden, welche ihren Zettel verloren haben</p>
            <label>Ersatz-IDs hinzufügen:</label>
            <input
                type="number"
                value={replacementAmount}
                onChange={(e) => setReplacementAmount(e.target.value)}
                className={styles.input}
            />
            <label>Klassen auswählen:</label>
            <div className={styles.selectButtons}>
                <button onClick={handleSelectAll} className={styles.selectButton}>Alle auswählen</button>
                <button onClick={handleDeselectAll} className={styles.selectButton}>Alle abwählen</button>
            </div>
            <div className={styles.classCheckboxes} style={{ color: 'grey' }}>
                <label className={styles.classSelectLabel}>
                    <input
                        type="checkbox"
                        value="Erstatz"
                        checked={replacementAmount > 0}
                        disabled={true}
                        onChange={handleClassSelection}
                    />
                    Ersatz
                </label>
                <div className={styles.newLine}></div>

                {classes.map((klasse, index) => (
                    <React.Fragment key={klasse}>
                        <label className={styles.classSelectLabel}>
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
            {message.download && <p className={styles.message}>{message.download}</p>}
            {loading.labels && <div className={styles.progress} />}
            <div className={styles.popupButtons}>
                <button
                    onClick={() => dialogRef.current.close()}
                    className={styles.redButton}
                >
                    Abbrechen
                </button>
                <button
                    onClick={handleGenerateLabels}
                    disabled={loading.labels}
                >
                    Generieren
                </button>
            </div>
        </dialog>
    );
};

export default GenerateLabelsDialog;
