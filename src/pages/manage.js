import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/Manage.module.css';
import { getNextId, API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useSortableTable } from '../hooks/useSortableTable';
import { useSearch } from '../hooks/useSearch';
import EditStudentDialog from '../components/dialogs/manage/EditStudentDialog';
import AddReplacementDialog from '../components/dialogs/manage/AddReplacementDialog';
import AddStudentDialog from '../components/dialogs/manage/AddStudentDialog';
import ConfirmDeleteDialog from '../components/dialogs/manage/ConfirmDeleteDialog';

export default function Manage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editForm, setEditForm] = useState({ vorname: '', nachname: '', klasse: '', geschlecht: 'männlich' });
  const [newStudent, setNewStudent] = useState({
    id: '',
    vorname: '',
    nachname: '',
    klasse: '',
    geschlecht: 'männlich',
    timestamps: [],
    replacements: [],
    spenden: null,
    spendenKonto: null
  });
  const [newReplacement, setNewReplacement] = useState('');
  const [message, setMessage] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);

  const { request, loading, error } = useApi();
  const { sortData, sortedData } = useSortableTable(students, availableClasses);
  const { searchTerm, setSearchTerm, filteredData } = useSearch(sortedData);

  const editStudentPopup = useRef(null);
  const addStudentPopup = useRef(null);
  const confirmDeletePopup = useRef(null);
  const addReplacementPopup = useRef(null);

  useEffect(() => {
    fetchStudents();
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = useCallback(async () => {
    try {
      const data = await request(API_ENDPOINTS.CLASSES);
      setAvailableClasses(data);
    } catch (error) {
      console.error('Error fetching available classes:', error);
    }
  }, [request]);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await request(API_ENDPOINTS.STUDENTS);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, [request]);

  const editStudentClick = useCallback((student) => {
    setSelectedStudent(student);
    setEditForm({
      vorname: student.vorname,
      nachname: student.nachname,
      klasse: student.klasse,
      geschlecht: student.geschlecht || 'männlich'
    });
    editStudentPopup.current.showModal();
  }, []);

  const deleteTimestamp = useCallback((indexToRemove) => {
    if (!selectedStudent) return;

    setSelectedStudent(prev => ({
      ...prev,
      timestamps: prev.timestamps.filter((_, index) => index !== indexToRemove)
    }));
  }, [selectedStudent]);

  const addReplacementID = useCallback(async () => {
    if (!selectedStudent || selectedStudent.replacements.includes(newReplacement)) {
      setMessage('Ersatz-ID ist bereits vergeben');
      return;
    }

    try {
      const data = await request(`/api/checkReplacement/${newReplacement}`);
      if (data.success) {
        setSelectedStudent(prev => ({
          ...prev,
          replacements: [...prev.replacements, newReplacement]
        }));
        addReplacementPopup.current.close();
        setMessage('');
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Error adding replacement:', error);
    }
  }, [request, selectedStudent, newReplacement]);

  const deleteReplacement = useCallback((indexToRemove) => {
    if (!selectedStudent) return;

    setSelectedStudent(prev => ({
      ...prev,
      replacements: prev.replacements.filter((_, index) => index !== indexToRemove)
    }));
  }, [selectedStudent]);

  const editStudent = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const updatedStudent = {
      ...selectedStudent,
      ...editForm
    };

    try {
      const data = await request(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        data: updatedStudent
      });

      if (data.success) {
        setStudents(prev => prev.map(student =>
          student.id === selectedStudent.id ? updatedStudent : student
        ));
        setSelectedStudent(null);
        editStudentPopup.current.close();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  }, [request, selectedStudent, editForm]);

  const deleteStudent = useCallback(async () => {
    if (!selectedStudent) return;

    try {
      await request(`/api/students/${selectedStudent.id}`, { method: 'DELETE' });
      setStudents(prev => prev.filter(student => student.id !== selectedStudent.id));
      setSelectedStudent(null);
      editStudentPopup.current.close();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  }, [request, selectedStudent]);

  const addStudentClick = () => {
    setNewStudent({
      id: getNextId(students).toString(),
      vorname: '',
      nachname: '',
      klasse: '',
      geschlecht: 'männlich',
      timestamps: [],
      replacements: [],
      spenden: null,
      spendenKonto: null
    });
    addStudentPopup.current.showModal();
  };

  const addStudentChangeField = useCallback((e) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({ ...prev, [name]: value }));
  }, []);

  const addStudentSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await request(`/api/students/${newStudent.id}`, {
        method: 'POST',
        data: newStudent
      });
      fetchStudents();
      addStudentPopup.current.close();
      setNewStudent({
        id: '',
        vorname: '',
        nachname: '',
        klasse: '',
        geschlecht: 'männlich',
        timestamps: [],
        replacements: [],
        spenden: null,
        spendenKonto: null
      });
    } catch (error) {
      console.error('Error adding student:', error);
    }
  }, [request, newStudent, fetchStudents]);

  const filteredStudents = filteredData;

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
            <th className={`${styles.sortable}`} onClick={() => sortData('id')}>ID</th>
            <th className={`${styles.sortable}`} onClick={() => sortData('klasse')}>Klasse</th>
            <th className={`${styles.sortable}`} onClick={() => sortData('vorname')}>Vorname</th>
            <th className={`${styles.sortable}`} onClick={() => sortData('nachname')}>Nachname</th>
            <th className={`${styles.sortable}`} onClick={() => sortData('geschlecht')}>Geschlecht</th>
            <th className={`${styles.sortable}`} onClick={() => sortData('timestamps')}>Runden</th>
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
              <td>{student.geschlecht || 'Nicht angegeben'}</td>
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
        editForm={editForm}
        setEditForm={setEditForm}
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