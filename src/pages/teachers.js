import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Teachers.module.css';

export default function Manage() {
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
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('asc');
    const [classTeacher, setClassTeacher] = useState({});
    const [loading, setLoading] = useState({ saveTeacher: false });

    const editTeacherPopup = useRef(null);
    const addTeacherPopup = useRef(null);
    const confirmDeletePopup = useRef(null);
    const classTeacherPopup = useRef(null);

    const allPossibleClasses = [
        '5a', '5b', '5c', '5d', '5e', '5f',
        '6a', '6b', '6c', '6d', '6e', '6f',
        '7a', '7b', '7c', '7d', '7e', '7f',
        '8a', '8b', '8c', '8d', '8e', '8f',
        '9a', '9b', '9c', '9d', '9e', '9f',
        '10a', '10b', '10c', '10d', '10e', '10f',
        'EF', 'Q1', 'Q2'
    ];

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await axios.get('/api/getAllTeachers');
            setTeachers(response.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const sortTeachersFunc = (field) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        setTeachers((prevTeachers) =>
            [...prevTeachers].sort((a, b) => {
                const aValue = a[field];
                const bValue = b[field];

                // sort after classes 
                if (field === 'klasse') {
                    const aClass = allPossibleClasses.indexOf(aValue);
                    const bClass = allPossibleClasses.indexOf(bValue);
                    return direction === 'asc' ? aClass - bClass : bClass - aClass;
                }

                if (field === 'id') {
                    return direction === 'asc'
                        ? parseInt(aValue) - parseInt(bValue)
                        : parseInt(bValue) - parseInt(aValue);
                }

                if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                return 0;
            })
        );
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
        setLoading({ saveTeacher: true });
        try {
            const response = await axios.post('/api/saveClassTeacher', classTeacher);
            classTeacherPopup.current.close();
            setLoading({ saveTeacher: false });
            setTeachers(response.data.teachers);
        } catch (error) {
            console.error('Error saving class teacher:', error);
        } finally {
            setLoading({ saveTeacher: false });
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
            const response = await axios.put(`/api/teachers/${selectedTeacher.id}`, updatedTeacher);
            if (response.data.success) {
                const updatedTeachers = teachers.map((teacher) =>
                    teacher.id === selectedTeacher.id ? updatedTeacher : teacher
                );
                setTeachers(updatedTeachers);
                setSelectedTeacher(null);
                editTeacherPopup.current.close();
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    const deleteTeacher = async () => {
        try {
            await axios.delete(`/api/teachers/${selectedTeacher.id}`);
            setTeachers(teachers.filter(teacher => teacher.id !== selectedTeacher.id));
            setSelectedTeacher(null);
            editTeacherPopup.current.close();
        } catch (error) {
            console.error('Error deleting teacher:', error);
        }
    };

    const addTeacherClick = () => {
        const highestId = Math.max(...teachers.map(s => parseInt(s.id, 10)), 0);
        setNewTeacher({
            id: highestId + 1,
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
            await axios.post(`/api/teachers/${newTeacher.id}`, newTeacher);
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

    const filteredTeachers = teachers.filter(teacher => {
        const searchLower = searchTerm.toLowerCase();
        return (
            teacher?.vorname?.toLowerCase().includes(searchLower) ||
            teacher?.nachname?.toLowerCase().includes(searchLower) ||
            teacher?.klasse?.toLowerCase().includes(searchLower)
        );
    });

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

            <dialog ref={editTeacherPopup} className={styles.popup}>
                <button className={styles.closeButtonX} onClick={() => editTeacherPopup.current.close()}>
                    &times;
                </button>

                <div>
                    <h2>Lehrer bearbeiten</h2>
                    <label>ID:</label>
                    <input
                        type="text"
                        value={selectedTeacher?.id}
                        disabled
                    />
                    <label>Vorname:</label>
                    <input
                        type="text"
                        value={editVorname}
                        onChange={(e) => setEditVorname(e.target.value)}
                    />
                    <label>Nachname:</label>
                    <input
                        type="text"
                        value={editNachname}
                        onChange={(e) => setEditNachname(e.target.value)}
                    />
                    <label>Klasse:</label>
                    <select
                        value={editKlasse}
                        onChange={(e) => setEditKlasse(e.target.value)}
                        className={styles.select}
                    >
                        {allPossibleClasses.map((klasse) => (
                            <option key={klasse} value={klasse}>
                                {klasse}
                            </option>
                        ))}
                    </select>
                    <label>E-Mail Adresse:</label>
                    <input
                        type="email"
                        placeholder="vorname.nachname@gesamtschule-kerpen.de"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                    />
                </div>

                <div className={styles.popupButtons}>
                    <button
                        className={styles.redButton}
                        onClick={() => confirmDeletePopup.current.showModal()}
                    >
                        Lehrer löschen
                    </button>
                    <button onClick={editTeacher}>Speichern</button>
                </div>
            </dialog >

            <dialog ref={addTeacherPopup} className={styles.popup} >
                <button className={styles.closeButtonX} onClick={() => addTeacherPopup.current.close()}>
                    &times;
                </button>
                <h2>Neuen Lehrer hinzufügen</h2>
                <form onSubmit={addTeacherSubmit}>
                    <label>ID:</label>
                    <input
                        type="text"
                        name="id"
                        value={newTeacher.id}
                        readOnly
                    />
                    <label>Vorname:</label>
                    <input
                        type="text"
                        name="vorname"
                        value={newTeacher.vorname}
                        onChange={addTeacherChangeField}
                        required
                    />
                    <label>Nachname:</label>
                    <input
                        type="text"
                        name="nachname"
                        value={newTeacher.nachname}
                        onChange={addTeacherChangeField}
                        required
                    />
                    <label>Klasse:</label>
                    <select
                        name="klasse"
                        value={newTeacher.klasse}
                        onChange={addTeacherChangeField}
                        className={styles.select}
                        required
                    >
                        {allPossibleClasses.map((klasse) => (
                            <option key={klasse} value={klasse}>
                                {klasse}
                            </option>
                        ))}
                    </select>
                    <label>E-Mail Adresse:</label>
                    <input
                        type="text"
                        name="email"
                        placeholder="vorname.nachname@gesamtschule-kerpen.de"
                        value={newTeacher.email}
                        onChange={addTeacherChangeField}
                        required
                    />
                    <div className={styles.popupButtons}>
                        <button className={styles.redButton} onClick={() => addTeacherPopup.current.close()}>Abbrechen</button>
                        <button type="submit">Hinzufügen</button>
                    </div>
                </form>
            </dialog >

            <dialog ref={confirmDeletePopup} className={styles.popup} >
                <button className={styles.closeButtonX} onClick={() => confirmDeletePopup.current.close()}>
                    &times;
                </button>
                <h2>Bestätigen Sie das Löschen</h2>
                <p>Möchten Sie diesen Lehrer wirklich löschen?</p>
                <div className={styles.popupButtons}>
                    <button
                        onClick={() => confirmDeletePopup.current.close()}
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={() => { deleteTeacher(); confirmDeletePopup.current.close(); editTeacherPopup.current.close(); }}
                        className={styles.redButton}
                    >
                        Lehrer löschen
                    </button>
                </div>
            </dialog >

            <dialog ref={classTeacherPopup} className={styles.popup}>
                <button className={styles.closeButtonX} onClick={() => classTeacherPopup.current.close()}>
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
                                                <option key={teacherOption.id} value={teacherOption.id}>
                                                    {teacherOption.nachname}, {teacherOption.vorname}
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
                        onClick={() => classTeacherPopup.current.close()}
                    >
                        Abbrechen
                    </button>
                    <button disabled={loading.saveTeacher} onClick={saveClassTeacher}>Speichern</button>
                </div>
                {loading.saveTeacher && <div className={styles.progress} />}
            </dialog>
        </div >
    );
}