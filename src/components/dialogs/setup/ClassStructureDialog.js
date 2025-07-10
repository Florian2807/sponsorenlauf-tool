import React from 'react';
import BaseDialog from '../../BaseDialog';

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
    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Speichern',
            variant: 'success',
            position: 'right',
            onClick: saveClassStructure
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Klassenstruktur verwalten"
            actions={actions}
            actionLayout="split"
            size="xl"
            showDefaultClose={false}
        >
            <p>Verwalten Sie die Jahrgänge und deren Klassen.</p>

            <div className="class-structure-container">
                {Object.entries(tempClassStructure).map(([grade, classes], gradeIndex) => (
                    <div
                        key={gradeIndex}
                        className="grade-section"
                    >
                        <div className="grade-header">
                            <div className="grade-input-wrapper">
                                <label className="form-label">Jahrgang/Stufe:</label>
                                <input
                                    type="text"
                                    defaultValue={grade}
                                    onBlur={(e) => handleGradeNameChange(grade, e.target.value)}
                                    className="form-input"
                                    placeholder="Jahrgangsname (z.B. Jahrgang 5, Oberstufe, etc.)"
                                />
                            </div>

                            <div className="grade-controls">
                                <button
                                    onClick={() => removeGrade(grade)}
                                    className="btn btn-danger btn-sm"
                                    title="Jahrgang löschen"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <div className="classes-container">
                            <div className="classes-header">
                                <label className="form-label">Klassen in diesem Jahrgang:</label>
                            </div>
                            {classes.map((className, classIndex) => (
                                <div
                                    key={classIndex}
                                    className="class-item"
                                >
                                    <input
                                        type="text"
                                        value={className}
                                        onChange={(e) => handleClassNameChange(grade, classIndex, e.target.value)}
                                        className="form-input"
                                        placeholder="Klassenname (z.B. 5a, 5b, etc.)"
                                    />

                                    <button
                                        onClick={() => removeClassFromGrade(grade, classIndex)}
                                        className="btn btn-danger btn-sm"
                                        title="Klasse löschen"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => addClassToGrade(grade)}
                                className="btn btn-secondary btn-sm"
                            >
                                + Klasse hinzufügen
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addGrade}
                    className="add-grade-button"
                >
                    + Jahrgang hinzufügen
                </button>
            </div>

            {message.upload && <p className="setup-message">{message.upload}</p>}
        </BaseDialog>
    );
};

export default ClassStructureDialog;
