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
            actionLayout="split"
            size="large"
            showDefaultClose={false}
        >
            <div className="class-teacher-container">
                {allPossibleClasses.map((className) => (
                    <div key={className} className="class-container">
                        <div className="class-title">{className}</div>
                        <div className="email-fields">
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="email-field">
                                    <select
                                        value={classTeacher[className]?.[index]?.id || ''}
                                        onChange={handleTeacherChange(className, index)}
                                        className="form-select"
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
        </BaseDialog>
    );
};

export default ClassTeacherDialog;
