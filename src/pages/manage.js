import { useState, useEffect, useRef, useCallback } from 'react';
import { getNextId, API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
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

  const { request, loading } = useApi();
  const { showError, showSuccess } = useGlobalError();
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
      showError(error, 'Beim Laden der verfügbaren Klassen');
    }
  }, [request, showError]);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await request(API_ENDPOINTS.STUDENTS);
      setStudents(data);
    } catch (error) {
      showError(error, 'Beim Laden der Schülerdaten');
    }
  }, [request, showError]);

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

  const addRound = useCallback(async (studentId, timestamp) => {
    if (!selectedStudent || selectedStudent.id !== studentId) return;

    try {
      // Runde über die API hinzufügen
      const response = await request('/api/runden', {
        method: 'POST',
        data: { 
          id: studentId, 
          date: new Date(timestamp),
          confirmDoubleScan: true // Bypass double-scan check in manual mode
        }
      });

      if (response?.success) {
        // Sofortige UI-Aktualisierung
        setSelectedStudent(prev => ({
          ...prev,
          timestamps: [...prev.timestamps, timestamp].sort((a, b) => new Date(b) - new Date(a))
        }));

        // Auch die Hauptliste aktualisieren
        setStudents(prevStudents => 
          prevStudents.map(student => 
            student.id === studentId 
              ? { ...student, timestamps: [...student.timestamps, timestamp].sort((a, b) => new Date(b) - new Date(a)) }
              : student
          )
        );

        showSuccess('Runde erfolgreich hinzugefügt');
        setMessage('');
      }
    } catch (error) {
      showError(error, 'Beim Hinzufügen der Runde');
      setMessage('Fehler beim Hinzufügen der Runde');
    }
  }, [selectedStudent, request, showError, showSuccess]);

  const addReplacementID = useCallback(async () => {
    if (!selectedStudent) return;

    try {
      if (newReplacement.trim()) {
        // Spezifische Ersatz-ID verwenden
        const data = await request('/api/addReplacements', {
          method: 'POST',
          data: {
            customId: newReplacement.trim().replace(new RegExp(`^(${new Date().getFullYear()}-|E)`, 'gi'), ''),
            studentId: selectedStudent.id
          }
        });

        if (data?.newReplacements?.length > 0) {
          // Sofortige UI-Aktualisierung ohne Reload
          setSelectedStudent(prev => ({
            ...prev,
            replacements: [...(prev.replacements || []), ...data.newReplacements]
          }));

          // Update auch in der Hauptliste
          setStudents(prev => prev.map(student =>
            student.id === selectedStudent.id
              ? { ...student, replacements: [...(student.replacements || []), ...data.newReplacements] }
              : student
          ));

          addReplacementPopup.current.close();
          setNewReplacement('');
          setMessage('');
        }
      } else {
        // Automatische Ersatz-ID erstellen
        const data = await request('/api/addReplacements', {
          method: 'POST',
          data: {
            amount: 1,
            studentId: selectedStudent.id
          }
        });

        if (data?.newReplacements?.length > 0) {
          // Sofortige UI-Aktualisierung ohne Reload
          setSelectedStudent(prev => ({
            ...prev,
            replacements: [...(prev.replacements || []), ...data.newReplacements]
          }));

          // Update auch in der Hauptliste
          setStudents(prev => prev.map(student =>
            student.id === selectedStudent.id
              ? { ...student, replacements: [...(student.replacements || []), ...data.newReplacements] }
              : student
          ));

          addReplacementPopup.current.close();
          setNewReplacement('');
          setMessage('');
        }
      }
    } catch (error) {
      if (error.status === 409) {
        setMessage('Diese Ersatz-ID ist bereits vergeben');
      } else {
        showError(error, 'Beim Erstellen der Ersatz-ID');
      }
    }
  }, [request, selectedStudent, newReplacement, showError]);

  const deleteReplacement = useCallback(async (replacementId) => {
    if (!selectedStudent) return;

    try {
      await request('/api/addReplacements', {
        method: 'DELETE',
        data: { replacementId }
      });

      // Sofortige UI-Aktualisierung ohne Reload
      setSelectedStudent(prev => ({
        ...prev,
        replacements: prev.replacements.filter(id => id !== replacementId)
      }));

      // Update auch in der Hauptliste
      setStudents(prev => prev.map(student =>
        student.id === selectedStudent.id
          ? { ...student, replacements: student.replacements.filter(id => id !== replacementId) }
          : student
      ));

    } catch (error) {
      showError(error, 'Beim Löschen der Ersatz-ID');
    }
  }, [request, selectedStudent, showError]);

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
        data: updatedStudent,
        errorContext: 'Beim Speichern der Schüleränderungen'
      });

      if (data?.success !== false) {
        // Update beide States synchron
        setStudents(prev => prev.map(student =>
          student.id === selectedStudent.id ? updatedStudent : student
        ));
        setSelectedStudent(updatedStudent);
        editStudentPopup.current?.close();
        showSuccess('Schüler erfolgreich gespeichert', 'Schüler bearbeiten');
      }
    } catch (error) {
      // Fehler wird automatisch über useApi gehandelt
    }
  }, [request, selectedStudent, editForm, showSuccess]);

  const deleteStudent = useCallback(async () => {
    if (!selectedStudent) return;

    try {
      await request(`/api/students/${selectedStudent.id}`, { method: 'DELETE' });
      setStudents(prev => prev.filter(student => student.id !== selectedStudent.id));
      setSelectedStudent(null);
      editStudentPopup.current?.close();
    } catch (error) {
      showError(error, 'Beim Löschen des Schülers');
    }
  }, [request, selectedStudent, showError]);

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
        data: newStudent,
        errorContext: 'Beim Hinzufügen des Schülers'
      });
      await fetchStudents();
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
      showSuccess('Schüler erfolgreich hinzugefügt', 'Schüler hinzufügen');
    } catch (error) {
      // Fehler wird automatisch über useApi gehandelt
    }
  }, [request, newStudent, fetchStudents, showSuccess]);

  return (
    <div className="page-container-wide">
      <h1 className="page-title">Schüler verwalten</h1>
      <div className="search-container">
        <div className="btn-group">
          <button className="btn" onClick={addStudentClick}>Schüler hinzufügen</button>
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
            <th className="sortable" onClick={() => sortData('id')}>ID</th>
            <th className="sortable" onClick={() => sortData('klasse')}>Klasse</th>
            <th className="sortable" onClick={() => sortData('vorname')}>Vorname</th>
            <th className="sortable" onClick={() => sortData('nachname')}>Nachname</th>
            <th className="sortable" onClick={() => sortData('geschlecht')}>Geschlecht</th>
            <th className="sortable" onClick={() => sortData('timestamps')}>Runden</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.klasse}</td>
              <td>{student.vorname}</td>
              <td>{student.nachname}</td>
              <td>{student.geschlecht || 'Nicht angegeben'}</td>
              <td>{student.timestamps.length}</td>
              <td>
                <button className="btn btn-sm" onClick={() => editStudentClick(student)}>Bearbeiten</button>
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
        loading={loading}
        addRound={addRound}
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
        loading={loading}
      />

      <ConfirmDeleteDialog
        dialogRef={confirmDeletePopup}
        deleteStudent={deleteStudent}
        editStudentPopup={editStudentPopup}
      />
    </div >
  );
}