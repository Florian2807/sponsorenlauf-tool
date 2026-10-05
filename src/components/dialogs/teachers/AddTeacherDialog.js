import { useRef } from 'react';
import BaseDialog from '../../BaseDialog';
import TeacherFormFields from './TeacherFormFields';

export default function AddTeacherDialog({ dialogRef, newTeacher, addTeacherChangeField, allPossibleClasses, addTeacherSubmit, loading = false }) {
    const formRef = useRef(null);
    const handleSubmit = event => {
        event.preventDefault();
        if (!loading && formRef.current?.reportValidity()) addTeacherSubmit(event);
    };
    return <BaseDialog dialogRef={dialogRef} title="Neuen Lehrer hinzufügen" size="large" showDefaultClose={false} actions={[
        { label: 'Abbrechen', position: 'left', disabled: loading, onClick: () => dialogRef.current.close() },
        { label: loading ? 'Wird hinzugefügt…' : 'Hinzufügen', disabled: loading || !newTeacher.vorname.trim() || !newTeacher.nachname.trim(), onClick: handleSubmit },
    ]}>
        <form ref={formRef} onSubmit={handleSubmit} className="student-add-form teacher-form">
            <div className="dialog-feature-intro">
                <span className="ui-icon" aria-hidden="true"><i className="fa-solid fa-user-plus" /></span>
                <div><h3>Lehrer hinzufügen</h3><p>Kontakt und Klasse hinterlegen, um Ergebnisse gezielt zu versenden.</p></div>
                <span className="student-new-id">ID {newTeacher.id}</span>
            </div>
            <TeacherFormFields prefix="addteacher" values={newTeacher} classes={allPossibleClasses} emailRequired disabled={loading}
                onChange={(name, value) => addTeacherChangeField({ target: { name, value } })} />
        </form>
    </BaseDialog>;
}
