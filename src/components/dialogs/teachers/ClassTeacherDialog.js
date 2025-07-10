import React from 'react';

const ClassTeacherDialog = ({
    dialogRef,
    allPossibleClasses,
    classTeacher,
    handleTeacherChange,
    teachers,
    loading,
    saveClassTeacher
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <div>
                <h2>Klassenlehrer Konfigurieren</h2>
                {allPossibleClasses.map((className) => (
                    <div key={className} className="class-container">
                        <div className="class-title">{className}</div>
                        <div className="email-fields">
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="email-field">
                                    <select
                                        value={classTeacher[className]?.[index]?.id || ''}
                                        onChange={handleTeacherChange(className, index)}
                                    >
                                        <option value="">Wählen Sie einen Lehrer</option>
                                        {teachers.map((teacherOption) => (
                                            <option key={teacherOption.id} value={teacherOption.id || ''}>
                                                {teacherOption.vorname} {teacherOption.nachname}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="dialog-actions">
                <button
                    className="btn btn-secondary"
                    onClick={() => dialogRef.current.close()}
                >
                    Abbrechen
                </button>
                <button
                    className="btn btn-primary"
                    disabled={loading.saveTeacher}
                    onClick={saveClassTeacher}
                >
                    Speichern
                </button>
            </div>
        </dialog>
    );
};

export default ClassTeacherDialog;
