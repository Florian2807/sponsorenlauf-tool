import React from 'react';
import styles from '../../../styles/Setup.module.css';

const ClassStructureDialog = ({
    dialogRef,
    tempClassStructure,
    handleGradeNameChange,
    removeGrade,
    handleClassNameChange,
    removeClassFromGrade,
    addClassToGrade,
    addGrade,
    message,
    saveClassStructure
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Klassenstruktur verwalten</h2>
            <p>Verwalten Sie die Jahrgänge und deren Klassen.</p>

            <div className={styles.classStructureContainer}>
                {Object.entries(tempClassStructure).map(([grade, classes], gradeIndex) => (
                    <div
                        key={gradeIndex}
                        className={styles.gradeSection}
                    >
                        <div className={styles.gradeHeader}>
                            <div className={styles.gradeInputWrapper}>
                                <label className={styles.gradeLabel}>Jahrgang/Stufe:</label>
                                <input
                                    type="text"
                                    defaultValue={grade}
                                    onBlur={(e) => handleGradeNameChange(grade, e.target.value)}
                                    className={styles.gradeInput}
                                    placeholder="Jahrgangsname (z.B. Jahrgang 5, Oberstufe, etc.)"
                                />
                            </div>

                            <div className={styles.gradeControls}>
                                <button
                                    onClick={() => removeGrade(grade)}
                                    className={styles.deleteButton}
                                    title="Jahrgang löschen"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className={styles.classesContainer}>
                            <div className={styles.classesHeader}>
                                <label className={styles.classesLabel}>Klassen in diesem Jahrgang:</label>
                            </div>
                            {classes.map((className, classIndex) => (
                                <div
                                    key={classIndex}
                                    className={styles.classItem}
                                >
                                    <input
                                        type="text"
                                        value={className}
                                        onChange={(e) => handleClassNameChange(grade, classIndex, e.target.value)}
                                        className={styles.classInput}
                                        placeholder="Klassenname (z.B. 5a, 5b, etc.)"
                                    />

                                    <button
                                        onClick={() => removeClassFromGrade(grade, classIndex)}
                                        className={styles.deleteButtonSmall}
                                        title="Klasse löschen"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => addClassToGrade(grade)}
                                className={styles.addClassButton}
                            >
                                + Klasse hinzufügen
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addGrade}
                    className={styles.addGradeButton}
                >
                    + Jahrgang hinzufügen
                </button>
            </div>

            {message.upload && <p className={styles.message}>{message.upload}</p>}

            <div className={styles.popupButtons}>
                <button
                    onClick={() => dialogRef.current.close()}
                    className={styles.redButton}
                >
                    Abbrechen
                </button>
                <button
                    onClick={saveClassStructure}
                    className={styles.button}
                >
                    Speichern
                </button>
            </div>
        </dialog>
    );
};

export default ClassStructureDialog;
