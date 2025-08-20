import { useState, useEffect, useRef } from 'react';
import { getNextId, API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useSortableTable } from '../hooks/useSortableTable';
import { useSearch } from '../hooks/useSearch';
import EditTeacherDialog from '../components/dialogs/teachers/EditTeacherDialog';
import AddTeacherDialog from '../components/dialogs/teachers/AddTeacherDialog';
import ConfirmDeleteTeacherDialog from '../components/dialogs/teachers/ConfirmDeleteTeacherDialog';
import ClassTeacherDialog from '../components/dialogs/teachers/ClassTeacherDialog';

export default function Teachers() {
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

    const { request, loading, error } = useApi();
    const { showError, showSuccess } = useGlobalError();

    const { sortField, sortDirection, sortData, sortedData } = useSortableTable(teachers, allPossibleClasses);
    const { searchTerm, setSearchTerm, filteredData } = useSearch(sortedData);

    const editTeacherPopup = useRef(null);
    const addTeacherPopup = useRef(null);
    const confirmDeletePopup = useRef(null);
    const classTeacherPopup = useRef(null);

    useEffect(() => {
        fetchTeachers();
        fetchAvailableClasses();
    }, []);

    const fetchAvailableClasses = async () => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE, {
                errorContext: 'Beim Laden der Klassenstruktur'
            });
            const classes = Object.values(data).flat();
            setAllPossibleClasses(classes);
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    };

    const fetchTeachers = async () => {
        try {
            const data = await request(API_ENDPOINTS.TEACHERS, {
                errorContext: 'Beim Laden der Lehrerdaten'
            });
            setTeachers(data);
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    };

    const sortTeachersFunc = (field) => {
        sortData(field);
    };

    const handleTeacherChange = (className, index) => (e) => {
        const newId = parseInt(e.target.value);
        const newT = [...classTeacher[className]];

        // Check if the teacher is already selected
        if (newT.some((teacher, i) => teacher.id === newId && i !== index)) {
            alert('Dieser Lehrer ist bereits ausgewählt.');
            return;
        }

        newT[index] = { ...newT[index], id: newId };
        if (!newT[index].id) {
            newT.splice(index, 1);
        }

        setClassTeacher((prev) => ({
            ...prev,
            [className]: newT
        }));
    };

    const saveClassTeacher = async () => {
        try {
            const data = await request('/api/saveClassTeacher', {
                method: 'POST',
                data: classTeacher,
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
            newClassTeacher[className] = teachers.filter(teacher => teacher.klasse === className).map(teacher => ({ id: teacher.id }));
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

    const filteredTeachers = filteredData;

    return (
        <div className="page-container-wide">
            <h1 className="page-title">Lehrer verwalten</h1>
            <div className="search-container">
                <div className="btn-group">
                    <button className="btn" onClick={addTeacherClick}>Lehrer hinzufügen</button>
                    <button className="btn btn-secondary" onClick={classTeacherClick}>Klassenlehrer Konfigurieren</button>
                </div>
                <input
                    type="text"
                    placeholder="Suche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th className={`sortable ${sortField === 'id' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('id')}>ID</th>
                        <th className={`sortable ${sortField === 'klasse' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('klasse')}>Klasse</th>
                        <th className={`sortable ${sortField === 'vorname' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('vorname')}>Vorname</th>
                        <th className={`sortable ${sortField === 'nachname' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('nachname')}>Nachname</th>
                        <th className={`sortable ${sortField === 'email' ? sortDirection : ''}`} onClick={() => sortTeachersFunc('email')}>E-Mail Adresse</th>
                        <th>Aktion</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTeachers.map((teacher) => (
                        <tr key={teacher.id}>
                            <td>{teacher.id}</td>
                            <td>{teacher.klasse}</td>
                            <td>{teacher.vorname}</td>
                            <td>{teacher.nachname}</td>
                            <td>{teacher.email}</td>
                            <td>
                                <button className="btn btn-sm" onClick={() => editTeacherClick(teacher)}>Bearbeiten</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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
