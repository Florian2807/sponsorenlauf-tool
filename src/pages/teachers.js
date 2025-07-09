import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Teachers.module.css';
import config from '../../data/config.json';
import { getNextId, API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useSortableTable } from '../hooks/useSortableTable';
import { useSearch } from '../hooks/useSearch';
import EditTeacherDialog from '../components/dialogs/teachers/EditTeacherDialog';
import AddTeacherDialog from '../components/dialogs/teachers/AddTeacherDialog';
import ConfirmDeleteTeacherDialog from '../components/dialogs/teachers/ConfirmDeleteTeacherDialog';
import ClassTeacherDialog from '../components/dialogs/teachers/ClassTeacherDialog';

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
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
    const [message, setMessage] = useState('');
    const [classTeacher, setClassTeacher] = useState({});

    const { request, loading, error } = useApi();

    const allPossibleClasses = Object.values(config.availableClasses).flat();
    const { sortField, sortDirection, sortData, sortedData } = useSortableTable(teachers, allPossibleClasses);
    const { searchTerm, setSearchTerm, filteredData } = useSearch(sortedData);

    const editTeacherPopup = useRef(null);
    const addTeacherPopup = useRef(null);
    const confirmDeletePopup = useRef(null);
    const classTeacherPopup = useRef(null);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const data = await request(API_ENDPOINTS.TEACHERS);
            setTeachers(data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
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
                data: classTeacher
            });
            classTeacherPopup.current.close();
            setTeachers(data.teachers);
        } catch (error) {
            console.error('Error saving class teacher:', error);
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
                data: updatedTeacher
            });
            if (data.success) {
                setTeachers(prev => prev.map(teacher =>
                    teacher.id === selectedTeacher.id ? updatedTeacher : teacher
                ));
                setSelectedTeacher(null);
                editTeacherPopup.current.close();
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const deleteTeacher = async () => {
        try {
            await request(`/api/teachers/${selectedTeacher.id}`, { method: 'DELETE' });
            setTeachers(prev => prev.filter(teacher => teacher.id !== selectedTeacher.id));
            setSelectedTeacher(null);
            editTeacherPopup.current.close();
        } catch (error) {
            console.error('Error deleting teacher:', error);
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
                data: newTeacher
            });
            fetchTeachers();
            addTeacherPopup.current.close();
            setNewTeacher({
                id: '',
                vorname: '',
                nachname: '',
                klasse: '',
                email: ''
            });
        } catch (error) {
            console.error('Error adding teacher:', error);
        }
    };

    const filteredTeachers = filteredData;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Lehrer verwalten</h1>
            <div className={styles.searchContainer}>
                <button onClick={addTeacherClick}>Lehrer hinzufügen</button>
                <input
                    type="text"
                    placeholder="Suche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <button onClick={classTeacherClick}>Klassenlehrer Konfigurieren</button>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={`${styles.sortable} ${sortField === 'id' ? styles[sortDirection] : ''}`} onClick={() => sortTeachersFunc('id')}>ID</th>
                        <th className={`${styles.sortable} ${sortField === 'klasse' ? styles[sortDirection] : ''}`} onClick={() => sortTeachersFunc('klasse')}>Klasse</th>
                        <th className={`${styles.sortable} ${sortField === 'vorname' ? styles[sortDirection] : ''}`} onClick={() => sortTeachersFunc('vorname')}>Vorname</th>
                        <th className={`${styles.sortable} ${sortField === 'nachname' ? styles[sortDirection] : ''}`} onClick={() => sortTeachersFunc('nachname')}>Nachname</th>
                        <th className={`${styles.sortable} ${sortField === 'email' ? styles[sortDirection] : ''}`} onClick={() => sortTeachersFunc('email')}>E-Mail Adresse</th>
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
                                <button onClick={() => editTeacherClick(teacher)}>Bearbeiten</button>
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
            />

            <AddTeacherDialog
                dialogRef={addTeacherPopup}
                newTeacher={newTeacher}
                addTeacherChangeField={addTeacherChangeField}
                allPossibleClasses={allPossibleClasses}
                addTeacherSubmit={addTeacherSubmit}
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
        </div >
    );
}