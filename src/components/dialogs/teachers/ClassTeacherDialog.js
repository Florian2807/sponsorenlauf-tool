import React from 'react';
import styles from '../../../styles/Teachers.module.css';

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
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <div>
                <h2 className={styles.subtitle}>Klassenlehrer Konfigurieren</h2>
                {allPossibleClasses.map((className) => (
                    <div key={className} className={styles.classContainer}>
                        <div className={styles.classTitle}>{className}</div>
                        <div className={styles.emailFields}>
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className={styles.emailField}>
                                    <select
                                        value={classTeacher[className]?.[index]?.id || ''}
                                        onChange={handleTeacherChange(className, index)}
                                        className={styles.select}
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
            <div className={styles.popupButtons}>
                <button
                    className={styles.redButton}
                    onClick={() => dialogRef.current.close()}
                >
                    Abbrechen
                </button>
                <button disabled={loading.saveTeacher} onClick={saveClassTeacher}>
                    Speichern
                </button>
            </div>
        </dialog>
    );
};

export default ClassTeacherDialog;
