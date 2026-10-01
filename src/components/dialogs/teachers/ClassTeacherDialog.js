import React from 'react';
import BaseDialog from '../../BaseDialog';

const ClassTeacherDialog = ({
    dialogRef,
    allPossibleClasses,
    classTeacher,
    handleTeacherChange,
    teachers,
    loading,
    saveClassTeacher
}) => {
    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: loading.saveTeacher ? 'Speichert...' : 'Speichern',
            variant: 'success',
            onClick: saveClassTeacher,
            disabled: loading.saveTeacher
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Klassenlehrer Konfigurieren"
            actions={actions}
            size="large"
            showDefaultClose={false}
        >
            <div className="class-teacher-container">
                {allPossibleClasses.map((className) => {
                    const assignments = classTeacher[className] || [{ id: null }];
                    const selectedCount = assignments.filter((assignment) => assignment.id).length;
                    return (
                        <section key={className} className="class-assignment-card">
                            <div className="class-assignment-header">
                                <h3 className="class-assignment-name">Klasse {className}</h3>
                                <span className="teacher-count-badge">{selectedCount} Lehrer</span>
                            </div>
                            <div className="teacher-assignment-list">
                                {assignments.map((assignment, index) => {
                                    const selectedTeacher = teachers.find((teacher) => teacher.id === assignment.id);
                                    const isLastEmpty = index === assignments.length - 1 && !assignment.id;
                                    return (
                                        <div
                                            key={assignment.id || 'empty'}
                                            className={`teacher-assignment-row ${isLastEmpty ? 'empty-field' : ''}`}
                                        >
                                            <select
                                                value={assignment.id || ''}
                                                onChange={handleTeacherChange(className, index)}
                                                className="teacher-assignment-select"
                                                aria-label={`Klasse ${className}, Lehrer ${index + 1}`}
                                            >
                                                <option value="">{isLastEmpty ? '+ Lehrer hinzufügen...' : 'Lehrer auswählen...'}</option>
                                                {teachers.map((teacherOption) => (
                                                    <option key={teacherOption.id} value={teacherOption.id}>
                                                        {teacherOption.vorname} {teacherOption.nachname}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedTeacher?.email && (
                                                <div className="teacher-email-display">{selectedTeacher.email}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </BaseDialog>
    );
};

export default ClassTeacherDialog;
