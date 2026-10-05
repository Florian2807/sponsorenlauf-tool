import { useRef } from 'react';
import BaseDialog from '../../BaseDialog';
import TeacherFormFields from './TeacherFormFields';

export default function EditTeacherDialog({ dialogRef, selectedTeacher, editVorname, setEditVorname, editNachname, setEditNachname, editKlasse, setEditKlasse, editEmail, setEditEmail, allPossibleClasses, confirmDeletePopup, editTeacher, loading = false }) {
    const formRef = useRef(null);
    const setters = { vorname: setEditVorname, nachname: setEditNachname, klasse: setEditKlasse, email: setEditEmail };
    const save = event => {
        event.preventDefault();
        if (!loading && formRef.current?.reportValidity()) editTeacher(event);
    };
    return <BaseDialog dialogRef={dialogRef} title="Lehrer bearbeiten" size="large" showDefaultClose={false} actions={[
        { label: 'Abbrechen', position: 'left', disabled: loading, onClick: () => dialogRef.current.close() },
        { label: loading ? 'Speichert…' : 'Speichern', disabled: loading || !editVorname.trim() || !editNachname.trim(), onClick: save },
    ]}>
        <form ref={formRef} onSubmit={save} className="student-add-form teacher-form">
            <div className="dialog-feature-intro">
                <span className="ui-icon" aria-hidden="true"><i className="fa-solid fa-user-pen" /></span>
                <div><h3>{selectedTeacher?.vorname} {selectedTeacher?.nachname}</h3><p>Name, Klasse und E-Mail-Adresse bearbeiten.</p></div>
                <span className="student-new-id">ID {selectedTeacher?.id}</span>
            </div>
            <TeacherFormFields prefix="editteacher" values={{ vorname: editVorname, nachname: editNachname, klasse: editKlasse, email: editEmail }} classes={allPossibleClasses} disabled={loading}
                onChange={(name, value) => setters[name](value)} />
            <details className="student-delete-section">
                <summary>Lehrer löschen</summary>
                <div className="student-delete-content"><p>Entfernt den Lehrer und seine Klassenzuordnungen.</p>
                    <button type="button" className="btn btn-danger btn-sm" disabled={loading} onClick={() => confirmDeletePopup.current.showModal()}>Lehrer löschen</button>
                </div>
            </details>
        </form>
    </BaseDialog>;
}
