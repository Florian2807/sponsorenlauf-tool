import { useState, useEffect, useRef, useCallback } from 'react';
import { getNextId, API_ENDPOINTS } from '../../utils/constants';
import { useApi } from '../../hooks/useApi';
import { useGlobalError } from '../../contexts/ErrorContext';
import { useSortableTable } from '../../hooks/useSortableTable';
import EditTeacherDialog from '../dialogs/teachers/EditTeacherDialog';
import AddTeacherDialog from '../dialogs/teachers/AddTeacherDialog';
import ConfirmDeleteTeacherDialog from '../dialogs/teachers/ConfirmDeleteTeacherDialog';
import ClassTeacherDialog from '../dialogs/teachers/ClassTeacherDialog';

export default function TeachersPanel({ embedded = false, active = true }) {
    const [teachers, setTeachers] = useState([]);
    const [allPossibleClasses, setAllPossibleClasses] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [editVorname, setEditVorname] = useState('');
    const [editNachname, setEditNachname] = useState('');
    const [editKlasse, setEditKlasse] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [newTeacher, setNewTeacher] = useState({
        id: '',
        vorname: '',
        nachname: '',
        klasse: '',
        email: ''
    });
    const [classTeacher, setClassTeacher] = useState({});
    const [teachersLoaded, setTeachersLoaded] = useState(false);
    const [classesLoaded, setClassesLoaded] = useState(false);

    const { request, loading } = useApi();
    const { showError, showSuccess } = useGlobalError();

    const { sortField, sortDirection, sortData, sortedData } = useSortableTable(teachers, allPossibleClasses);

    const editTeacherPopup = useRef(null);
    const addTeacherPopup = useRef(null);
    const confirmDeletePopup = useRef(null);
    const classTeacherPopup = useRef(null);

    const fetchAvailableClasses = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE, {
                errorContext: 'Beim Laden der Klassenstruktur'
            });
            const classes = Object.values(data).flat();
            setAllPossibleClasses(classes);
            setClassesLoaded(true);
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    }, [request]);

    const fetchTeachers = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.TEACHERS, {
                errorContext: 'Beim Laden der Lehrerdaten'
            });
            setTeachers(data);
            setTeachersLoaded(true);
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    }, [request]);

    useEffect(() => {
        if (!active) return;
        fetchTeachers();
        fetchAvailableClasses();
    }, [active, fetchTeachers, fetchAvailableClasses]);

    const sortTeachersFunc = (field) => {
        sortData(field);
    };

    const handleTeacherChange = (className, index) => (e) => {
        const newId = e.target.value ? Number(e.target.value) : null;

        // Check if the teacher is already selected
        if (newId && classTeacher[className]?.some((teacher, i) => teacher.id === newId && i !== index)) {
            showError('Dieser Lehrer ist bereits ausgewählt.', 'Klassenlehrer');
            return;
        }

        setClassTeacher((prev) => {
            const classTeachers = [...(prev[className] || [{ id: null }])];
            classTeachers[index] = { id: newId };
            return {
                ...prev,
                [className]: [...classTeachers.filter((teacher) => teacher.id), { id: null }]
            };
        });
    };

    const saveClassTeacher = async () => {
        try {
            const assignments = Object.fromEntries(allPossibleClasses.map((className) => [
                className,
                (classTeacher[className] || []).filter((teacher) => teacher.id)
            ]));
            const data = await request('/api/saveClassTeacher', {
                method: 'POST',
                data: assignments,
                errorContext: 'Beim Speichern des Klassenlehrers'
            });
            classTeacherPopup.current.close();
            setTeachers(data.teachers);
            showSuccess('Klassenlehrer erfolgreich gespeichert', 'Klassenlehrer');
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    };

    const editTeacherClick = (teacher) => {
        setSelectedTeacher(teacher);
        setEditVorname(teacher.vorname);
        setEditNachname(teacher.nachname);
        setEditKlasse(teacher.klasse);
        setEditEmail(teacher.email);
        editTeacherPopup.current.showModal();
    };

    const editTeacher = async (e) => {
        e.preventDefault();
        const updatedTeacher = {
            id: selectedTeacher.id,
            vorname: editVorname,
            nachname: editNachname,
            klasse: editKlasse,
            email: editEmail
        };

        try {
            const data = await request(`/api/teachers/${selectedTeacher.id}`, {
                method: 'PUT',
                data: updatedTeacher,
                errorContext: 'Beim Speichern der Lehreränderungen'
            });
            if (data.success) {
                setTeachers(prev => prev.map(teacher =>
                    teacher.id === selectedTeacher.id ? updatedTeacher : teacher
                ));
                setSelectedTeacher(null);
                editTeacherPopup.current.close();
                showSuccess('Lehrer erfolgreich gespeichert', 'Lehrer bearbeiten');
            }
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    };

    const deleteTeacher = async () => {
        try {
            await request(`/api/teachers/${selectedTeacher.id}`, {
                method: 'DELETE',
                errorContext: 'Beim Löschen des Lehrers'
            });
            setTeachers(prev => prev.filter(teacher => teacher.id !== selectedTeacher.id));
            setSelectedTeacher(null);
            editTeacherPopup.current.close();
            showSuccess('Lehrer erfolgreich gelöscht', 'Lehrer löschen');
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    };

    const addTeacherClick = () => {
        setNewTeacher({
            id: getNextId(teachers),
            vorname: '',
            nachname: '',
            klasse: '',
            email: ''
        });
        addTeacherPopup.current.showModal();
    };

    const classTeacherClick = () => {
        const newClassTeacher = {};
        for (const className of allPossibleClasses) {
            newClassTeacher[className] = [
                ...teachers.filter(teacher => teacher.klasse === className).map(teacher => ({ id: teacher.id })),
                { id: null }
            ];
        }
        setClassTeacher(newClassTeacher);
        classTeacherPopup.current.showModal();
    };

    const addTeacherChangeField = (e) => {
        setNewTeacher({ ...newTeacher, [e.target.name]: e.target.value });
    };

    const addTeacherSubmit = async (e) => {
        e.preventDefault();
        try {
            await request(`/api/teachers/${newTeacher.id}`, {
                method: 'POST',
                data: newTeacher,
                errorContext: 'Beim Hinzufügen des Lehrers'
            });
            await fetchTeachers();
            addTeacherPopup.current.close();
            setNewTeacher({
                id: '',
                vorname: '',
                nachname: '',
                klasse: '',
                email: ''
            });
            showSuccess('Lehrer erfolgreich hinzugefügt', 'Lehrer hinzufügen');
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    };

    return (
        <div className={embedded ? "setup-resource-panel" : "app-page page-container-wide"}>
            <div className="student-page-heading teacher-page-heading">
                <div><h1 className="page-title">Lehrer verwalten</h1><p className="student-page-description">Kontakte pflegen und Lehrer ihren Klassen zuordnen.</p></div>
                <div className="btn-group">
                    <button type="button" className="btn btn-secondary" onClick={classTeacherClick} disabled={!teachersLoaded || !classesLoaded}>Klassenlehrer Konfigurieren</button>
                    <button type="button" className="btn" onClick={addTeacherClick}><i className="fa-solid fa-plus" aria-hidden="true" /> Lehrer hinzufügen</button>
                </div>
            </div>
            <div className="teacher-sort-controls">
                <label className="manage-filter-field student-mobile-sort"><span>Sortieren</span><select className="form-select" value={sortField} onChange={event => sortData(event.target.value)}>
                    <option value="id">ID</option><option value="klasse">Klasse</option><option value="vorname">Vorname</option><option value="nachname">Nachname</option><option value="email">E-Mail</option>
                </select></label>
                <button type="button" className="btn btn-secondary student-mobile-sort-direction" onClick={() => sortData(sortField)}>{sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}</button>
            </div>

            {loading && teachers.length === 0 ? <div className="message message-info">Lehrerdaten werden geladen...</div> : null}

            <div className="table-responsive teacher-directory">
                <table className="table">
                    <caption className="sr-only">Lehrerliste – über die Spaltenüberschriften sortieren</caption>
                    <thead>
                        <tr>
                            <th aria-sort={sortField === 'id' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                <button type="button" className={`table-sort-button sortable ${sortField === 'id' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('id')}>ID</button>
                            </th>
                            <th aria-sort={sortField === 'klasse' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                <button type="button" className={`table-sort-button sortable ${sortField === 'klasse' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('klasse')}>Klasse</button>
                            </th>
                            <th aria-sort={sortField === 'vorname' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                <button type="button" className={`table-sort-button sortable ${sortField === 'vorname' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('vorname')}>Vorname</button>
                            </th>
                            <th aria-sort={sortField === 'nachname' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                <button type="button" className={`table-sort-button sortable ${sortField === 'nachname' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('nachname')}>Nachname</button>
                            </th>
                            <th aria-sort={sortField === 'email' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                <button type="button" className={`table-sort-button sortable ${sortField === 'email' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('email')}>E-Mail Adresse</button>
                            </th>
                            <th>Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((teacher) => (
                            <tr key={teacher.id}>
                                <td className="teacher-id-cell"><strong className="teacher-mobile-name">{teacher.vorname} {teacher.nachname}</strong><span className="teacher-mobile-id-label">ID </span>{teacher.id}</td>
                                <td className="teacher-class-cell"><span className="student-class-badge">{teacher.klasse || 'Ohne Zuordnung'}</span></td>
                                <td className="teacher-name-cell">{teacher.vorname}</td>
                                <td className="teacher-name-cell">{teacher.nachname}</td>
                                <td className="teacher-email-cell">{teacher.email || <span className="teacher-missing-email">Keine E-Mail hinterlegt</span>}</td>
                                <td>
                                    <button type="button" className="btn btn-secondary btn-sm" aria-label={`${teacher.vorname} ${teacher.nachname} bearbeiten`} onClick={() => editTeacherClick(teacher)}><i className="fa-solid fa-pen" aria-hidden="true" /> Bearbeiten</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!loading && sortedData.length === 0 ? <div className="empty-state">Noch keine Lehrer angelegt.</div> : null}

            <EditTeacherDialog
                dialogRef={editTeacherPopup}
                selectedTeacher={selectedTeacher}
                editVorname={editVorname}
                setEditVorname={setEditVorname}
                editNachname={editNachname}
                setEditNachname={setEditNachname}
                editKlasse={editKlasse}
                setEditKlasse={setEditKlasse}
                editEmail={editEmail}
                setEditEmail={setEditEmail}
                allPossibleClasses={allPossibleClasses}
                confirmDeletePopup={confirmDeletePopup}
                editTeacher={editTeacher}
                loading={loading}
            />

            <AddTeacherDialog
                dialogRef={addTeacherPopup}
                newTeacher={newTeacher}
                addTeacherChangeField={addTeacherChangeField}
                allPossibleClasses={allPossibleClasses}
                addTeacherSubmit={addTeacherSubmit}
                loading={loading}
            />

            <ConfirmDeleteTeacherDialog
                dialogRef={confirmDeletePopup}
                deleteTeacher={deleteTeacher}
                editTeacherPopup={editTeacherPopup}
            />

            <ClassTeacherDialog
                dialogRef={classTeacherPopup}
                allPossibleClasses={allPossibleClasses}
                classTeacher={classTeacher}
                handleTeacherChange={handleTeacherChange}
                teachers={teachers}
                loading={loading}
                saveClassTeacher={saveClassTeacher}
            />
        </div>
    );
}
