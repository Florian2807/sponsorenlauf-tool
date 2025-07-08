import { useState, useEffect, useRef, useMemo } from 'react';
import axios, { all } from 'axios';
import styles from '../styles/Manage.module.css';
import { formatDate } from '/utils/globalFunctions';
import EditStudentDialog from '../components/dialogs/manage/EditStudentDialog';
import AddReplacementDialog from '../components/dialogs/manage/AddReplacementDialog';
import AddStudentDialog from '../components/dialogs/manage/AddStudentDialog';
import ConfirmDeleteDialog from '../components/dialogs/manage/ConfirmDeleteDialog';

export default function Manage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editVorname, setEditVorname] = useState('');
  const [editNachname, setEditNachname] = useState('');
  const [editKlasse, setEditKlasse] = useState('');
  const [newStudent, setNewStudent] = useState({
    id: '',
    vorname: '',
    nachname: '',
    klasse: '',
    timestamps: [],
    replacements: [],
    spenden: null,
    spendenKonto: null
  });
  const [newReplacement, setNewReplacement] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [availableClasses, setAvailableClasses] = useState([]);

  const editStudentPopup = useRef(null);
  const addStudentPopup = useRef(null);
  const confirmDeletePopup = useRef(null);
  const addReplacementPopup = useRef(null);

  useEffect(() => {
    fetchStudents();
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const response = await axios.get('/api/getAvailableClasses');
      setAvailableClasses(response.data);
    } catch (error) {
      console.error('Error fetching available classes:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/getAllStudents');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const sortStudentsFunc = (field) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedStudents = useMemo(() => {
    const sorted = [...students];
    sorted.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === 'klasse') {
        const aClass = allPossibleClasses.indexOf(aValue);
        const bClass = allPossibleClasses.indexOf(bValue);
        return sortDirection === 'asc' ? aClass - bClass : bClass - aClass;
      }

      if (sortField === 'id') {
        return sortDirection === 'asc'
          ? parseInt(aValue) - parseInt(bValue)
          : parseInt(bValue) - parseInt(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [students, sortField, sortDirection]);

  const editStudentClick = (student) => {
    setSelectedStudent(student);
    setEditVorname(student.vorname);
    setEditNachname(student.nachname);
    setEditKlasse(student.klasse);
    editStudentPopup.current.showModal();
  };

  const deleteTimestamp = (indexToRemove) => {
    const updatedTimestamps = selectedStudent.timestamps.filter((_, index) => index !== indexToRemove);
    setSelectedStudent((prev) => ({
      ...prev,
      timestamps: updatedTimestamps
    }));
  };

  const addReplacementID = async () => {
    const updatedReplacements = [...selectedStudent.replacements, newReplacement];
    try {
      const response = await axios.get(`/api/checkReplacement/${newReplacement}`);
      if (response.data.success) {
        if (selectedStudent.replacements.includes(newReplacement)) {
          setMessage('Ersatz-ID ist bereits vergeben');
          return;
        }
        setMessage('');
        setSelectedStudent((prev) => ({
          ...prev,
          replacements: updatedReplacements
        }));
        addReplacementPopup.current.close();
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error adding replacement:', error);
    }
  };

  const deleteReplacement = (indexToRemove) => {
    const updatedReplacements = selectedStudent.replacements.filter((_, index) => index !== indexToRemove);
    setSelectedStudent((prev) => ({
      ...prev,
      replacements: updatedReplacements
    }));
  };

  const editStudent = async (e) => {
    e.preventDefault();
    const updatedStudent = {
      id: selectedStudent.id,
      vorname: editVorname,
      nachname: editNachname,
      klasse: editKlasse,
      timestamps: selectedStudent.timestamps,
      replacements: selectedStudent.replacements
    };

    try {
      const response = await axios.put(`/api/students/${selectedStudent.id}`, updatedStudent);
      if (response.data.success) {
        const updatedStudents = students.map((student) =>
          student.id === selectedStudent.id ? updatedStudent : student
        );
        setStudents(updatedStudents);
        setSelectedStudent(null);
        editStudentPopup.current.close();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const deleteStudent = async () => {
    try {
      await axios.delete(`/api/students/${selectedStudent.id}`);
      setStudents(students.filter(student => student.id !== selectedStudent.id));
      setSelectedStudent(null);
      editStudentPopup.current.close();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const addStudentClick = () => {
    const highestId = Math.max(...students.map(s => parseInt(s.id, 10)), 0);
    setNewStudent({
      id: (highestId + 1).toString(),
      vorname: '',
      nachname: '',
      klasse: '',
      timestamps: [],
      replacements: [],
      spenden: null,
      spendenKonto: null
    });
    addStudentPopup.current.showModal();
  };

  const addStudentChangeField = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const addStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/students/${newStudent.id}`, newStudent);
      fetchStudents();
      addStudentPopup.current.close();
      setNewStudent({
        id: '',
        vorname: '',
        nachname: '',
        klasse: '',
        timestamps: [],
        replacements: [],
        spenden: null,
        spendenKonto: null
      });
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return sortedStudents.filter(student => (
      student?.vorname?.toLowerCase().includes(searchLower) ||
      student?.nachname?.toLowerCase().includes(searchLower) ||
      student?.klasse?.toLowerCase().includes(searchLower)
    ));
  }, [sortedStudents, searchTerm]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Schüler verwalten</h1>
      <div className={styles.searchContainer}>
        <button onClick={addStudentClick}>Schüler hinzufügen</button>
        <input
          type="text"
          placeholder="Suche..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.sortable} ${sortField === 'id' ? styles[sortDirection] : ''}`} onClick={() => sortStudentsFunc('id')}>ID</th>
            <th className={`${styles.sortable} ${sortField === 'klasse' ? styles[sortDirection] : ''}`} onClick={() => sortStudentsFunc('klasse')}>Klasse</th>
            <th className={`${styles.sortable} ${sortField === 'vorname' ? styles[sortDirection] : ''}`} onClick={() => sortStudentsFunc('vorname')}>Vorname</th>
            <th className={`${styles.sortable} ${sortField === 'nachname' ? styles[sortDirection] : ''}`} onClick={() => sortStudentsFunc('nachname')}>Nachname</th>
            <th className={`${styles.sortable} ${sortField === 'timestamps' ? styles[sortDirection] : ''}`} onClick={() => sortStudentsFunc('timestamps')}>Runden</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.klasse}</td>
              <td>{student.vorname}</td>
              <td>{student.nachname}</td>
              <td>{student.timestamps.length}</td>
              <td>
                <button onClick={() => editStudentClick(student)}>Bearbeiten</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <EditStudentDialog
        dialogRef={editStudentPopup}
        selectedStudent={selectedStudent}
        editVorname={editVorname}
        setEditVorname={setEditVorname}
        editNachname={editNachname}
        setEditNachname={setEditNachname}
        editKlasse={editKlasse}
        setEditKlasse={setEditKlasse}
        availableClasses={availableClasses}
        deleteTimestamp={deleteTimestamp}
        deleteReplacement={deleteReplacement}
        setMessage={setMessage}
        setNewReplacement={setNewReplacement}
        addReplacementPopup={addReplacementPopup}
        confirmDeletePopup={confirmDeletePopup}
        editStudent={editStudent}
      />

      <AddReplacementDialog
        dialogRef={addReplacementPopup}
        newReplacement={newReplacement}
        setNewReplacement={setNewReplacement}
        message={message}
        addReplacementID={addReplacementID}
      />

      <AddStudentDialog
        dialogRef={addStudentPopup}
        newStudent={newStudent}
        addStudentChangeField={addStudentChangeField}
        availableClasses={availableClasses}
        addStudentSubmit={addStudentSubmit}
      />

      <ConfirmDeleteDialog
        dialogRef={confirmDeletePopup}
        deleteStudent={deleteStudent}
        editStudentPopup={editStudentPopup}
      />
    </div >
  );
}