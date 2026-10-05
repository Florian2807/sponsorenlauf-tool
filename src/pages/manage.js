import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getNextId, API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useSortableTable } from '../hooks/useSortableTable';
import { useSearch } from '../hooks/useSearch';
import EditStudentDialog from '../components/dialogs/manage/EditStudentDialog';
import AddReplacementDialog from '../components/dialogs/manage/AddReplacementDialog';
import { normalizeReplacementId } from '../utils/studentId';
import { createClientId } from '../utils/clientId';
import AddStudentDialog from '../components/dialogs/manage/AddStudentDialog';
import ConfirmDeleteDialog from '../components/dialogs/manage/ConfirmDeleteDialog';

export default function Manage() {
  const router = useRouter();
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
  const [classFilter, setClassFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(40);

  const { request, loading } = useApi();
  const { showError, showSuccess } = useGlobalError();
  const { sortField, sortDirection, sortData, sortedData } = useSortableTable(students, availableClasses);
  const { searchTerm, setSearchTerm, filteredData } = useSearch(sortedData, ['id', 'vorname', 'nachname', 'klasse']);

  const editStudentPopup = useRef(null);
  const addStudentPopup = useRef(null);
  const confirmDeletePopup = useRef(null);
  const addReplacementPopup = useRef(null);
  const loadMoreRef = useRef(null);
  const openedStudentQueryRef = useRef(null);

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

  useEffect(() => {
    fetchStudents();
    fetchAvailableClasses();
  }, [fetchStudents, fetchAvailableClasses]);

  useEffect(() => {
    setVisibleCount(40);
  }, [searchTerm, classFilter, roundFilter]);
  
  const filteredStudents = useMemo(() => {
    return filteredData.filter((student) => {
      const matchesClass = classFilter === 'all' || student.klasse === classFilter;
      const roundCount = student.timestamps.length;
      const matchesRounds =
        roundFilter === 'all'
        || (roundFilter === 'with-rounds' && roundCount > 0)
        || (roundFilter === 'no-rounds' && roundCount === 0)
        || (roundFilter === 'with-replacements' && (student.replacements || []).length > 0);

      return matchesClass && matchesRounds;
    });
  }, [classFilter, filteredData, roundFilter]);

  const visibleStudents = useMemo(() => {
    return filteredStudents.slice(0, visibleCount);
  }, [filteredStudents, visibleCount]);

  const hasMoreStudents = visibleCount < filteredStudents.length;

  const activeFilterCount = [
    classFilter !== 'all',
    roundFilter !== 'all',
  ].filter(Boolean).length;

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !hasMoreStudents) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          setVisibleCount((currentCount) => Math.min(currentCount + 40, filteredStudents.length));
        }
      },
      {
        rootMargin: '300px 0px',
      }
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [filteredStudents.length, hasMoreStudents]);

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

  useEffect(() => {
    if (!router.isReady || students.length === 0) return;

    const rawStudentId = router.query.student;
    const requestedStudentId = Array.isArray(rawStudentId) ? rawStudentId[0] : rawStudentId;
    if (!requestedStudentId || openedStudentQueryRef.current === requestedStudentId) return;

    const requestedStudent = students.find((student) => String(student.id) === requestedStudentId);
    if (!requestedStudent) return;

    openedStudentQueryRef.current = requestedStudentId;
    editStudentClick(requestedStudent);
  }, [editStudentClick, router.isReady, router.query.student, students]);

  const deleteTimestamp = useCallback(async (roundId) => {
    if (!selectedStudent) return;

    try {
      await request(`/api/rounds/${roundId}`, {
        method: 'DELETE',
        data: { studentId: selectedStudent.id },
        errorContext: 'Beim Löschen der Runde'
      });

      const removeRound = (student) => {
        const rounds = (student.rounds || []).filter((round) => round.id !== roundId);
        return {
          ...student,
          rounds,
          timestamps: rounds.map((round) => round.timestamp),
        };
      };

      setSelectedStudent((currentStudent) => removeRound(currentStudent));
      setStudents((currentStudents) => currentStudents.map((student) => (
        student.id === selectedStudent.id ? removeRound(student) : student
      )));
      showSuccess('Runde erfolgreich gelöscht');
    } catch (error) {
      // Fehler wird automatisch über useApi angezeigt.
    }
  }, [request, selectedStudent, showSuccess]);

  const addRound = useCallback(async (studentId) => {
    if (!selectedStudent || selectedStudent.id !== studentId) return;

    try {
      // Runde über die API hinzufügen
      const response = await request('/api/runden', {
        method: 'POST',
        data: { 
          id: studentId, 
          scanId: createClientId('manual'),
          confirmDoubleScan: true // Bypass double-scan check in manual mode
        }
      });

      if (response?.success) {
        const savedRound = response.round;
        // Sofortige UI-Aktualisierung
        setSelectedStudent(prev => ({
          ...prev,
          rounds: [savedRound, ...(prev.rounds || [])],
          timestamps: [savedRound.timestamp, ...prev.timestamps]
        }));

        // Auch die Hauptliste aktualisieren
        setStudents(prevStudents => 
          prevStudents.map(student => 
            student.id === studentId 
              ? {
                  ...student,
                  rounds: [savedRound, ...(student.rounds || [])],
                  timestamps: [savedRound.timestamp, ...student.timestamps]
                }
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
        const normalizedReplacementId = normalizeReplacementId(newReplacement);
        if (!normalizedReplacementId) {
          setMessage('Bitte geben Sie eine gültige Ersatz-ID ein');
          return;
        }

        const data = await request('/api/addReplacements', {
          method: 'POST',
          data: {
            customId: normalizedReplacementId,
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

    const updatedStudent = { ...selectedStudent, ...editForm };

    try {
      const data = await request(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        // Stammdaten dürfen niemals eine möglicherweise veraltete Rundenliste
        // mitsenden. Runden haben eigene append/delete Endpunkte.
        data: editForm,
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
      const result = await request(`/api/students/${selectedStudent.id}`, { method: 'DELETE' });
      setStudents(prev => prev.filter(student => student.id !== selectedStudent.id));
      setSelectedStudent(null);
      editStudentPopup.current?.close();
      showSuccess(`Schüler gelöscht. Sicherheitskopie: ${result.backupFilename}`, 'Schüler löschen');
    } catch (error) {
      showError(error, 'Beim Löschen des Schülers');
    }
  }, [request, selectedStudent, showError, showSuccess]);

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
      setStudents((prevStudents) => [...prevStudents, { ...newStudent, id: String(newStudent.id) }]);
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
  }, [request, newStudent, showSuccess]);

  const clearFilters = useCallback(() => {
    setClassFilter('all');
    setRoundFilter('all');
  }, []);

  return (
    <div className="app-page page-container-extra-wide manage-page">
      <div className="student-page-heading" data-tour="manage">
        <div>
          <h1 className="page-title">Schüler verwalten</h1>
          <p className="student-page-description">Schüler suchen, Daten bearbeiten und Laufkarten verwalten.</p>
        </div>
        <button type="button" className="btn" onClick={addStudentClick}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> Schüler hinzufügen
        </button>
      </div>

      <div className="student-list-toolbar ui-surface">
        <label className="student-search-field" htmlFor="manage-search">
          <span>Suchen</span>
          <input id="manage-search" type="search" placeholder="Name, Klasse oder ID"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" />
        </label>
        <label className="manage-filter-field">
          <span>Klasse</span>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="form-select">
            <option value="all">Alle Klassen</option>
            {availableClasses.map((className) => <option key={className} value={className}>{className}</option>)}
          </select>
        </label>
        <label className="manage-filter-field">
          <span>Status</span>
          <select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)} className="form-select">
            <option value="all">Alle Schüler</option>
            <option value="with-rounds">Mit Runden</option>
            <option value="no-rounds">Ohne Runden</option>
            <option value="with-replacements">Mit Ersatz-ID</option>
          </select>
        </label>
        {(activeFilterCount > 0 || searchTerm) && (
          <button type="button" className="btn btn-secondary student-filter-reset" onClick={() => { clearFilters(); setSearchTerm(''); }}>Zurücksetzen</button>
        )}
        <label className="manage-filter-field student-mobile-sort">
          <span>Sortieren</span>
          <select className="form-select" value={sortField} onChange={(e) => sortData(e.target.value)}>
            <option value="id">ID</option><option value="klasse">Klasse</option>
            <option value="vorname">Vorname</option><option value="nachname">Nachname</option>
            <option value="geschlecht">Geschlecht</option><option value="timestamps">Runden</option>
          </select>
        </label>
        <button type="button" className="btn btn-secondary student-mobile-sort-direction" onClick={() => sortData(sortField)}>
          <i className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`} aria-hidden="true" />
          {sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
        </button>
        <div className="student-list-count" role="status">
          <strong>{filteredStudents.length}</strong> von {students.length} Schülern
        </div>
      </div>

      {loading && students.length === 0 ? <div className="message message-info">Schülerdaten werden geladen...</div> : null}

      <div className="table-responsive student-directory">
        <table className="table">
          <caption className="sr-only">Schülerliste – über die Spaltenüberschriften sortieren</caption>
          <thead>
            <tr>
              <th aria-sort={sortField === 'id' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`table-sort-button sortable ${sortField === 'id' ? sortDirection : ''}`} onClick={() => sortData('id')}>ID</button>
              </th>
              <th aria-sort={sortField === 'klasse' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`table-sort-button sortable ${sortField === 'klasse' ? sortDirection : ''}`} onClick={() => sortData('klasse')}>Klasse</button>
              </th>
              <th aria-sort={sortField === 'vorname' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`table-sort-button sortable ${sortField === 'vorname' ? sortDirection : ''}`} onClick={() => sortData('vorname')}>Vorname</button>
              </th>
              <th aria-sort={sortField === 'nachname' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`table-sort-button sortable ${sortField === 'nachname' ? sortDirection : ''}`} onClick={() => sortData('nachname')}>Nachname</button>
              </th>
              <th aria-sort={sortField === 'geschlecht' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`table-sort-button sortable ${sortField === 'geschlecht' ? sortDirection : ''}`} onClick={() => sortData('geschlecht')}>Geschlecht</button>
              </th>
              <th aria-sort={sortField === 'timestamps' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`table-sort-button sortable ${sortField === 'timestamps' ? sortDirection : ''}`} onClick={() => sortData('timestamps')}>Runden</button>
              </th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student) => (
              <tr key={student.id}>
                <td className="student-id-cell"><strong className="student-mobile-name">{student.vorname} {student.nachname}</strong><span className="student-mobile-id-label">ID </span>{student.id}</td>
                <td><span className="student-class-badge">{student.klasse || '–'}</span></td>
                <td className="student-name-cell">{student.vorname}</td>
                <td className="student-name-cell">{student.nachname}</td>
                <td>{student.geschlecht || 'Nicht angegeben'}</td>
                <td><span className="student-round-count">{student.timestamps.length}</span><span className="student-mobile-round-label"> Runden</span></td>
                <td>
                  <button type="button" className="btn btn-secondary btn-sm" aria-label={`${student.vorname} ${student.nachname} bearbeiten`} onClick={() => editStudentClick(student)}><i className="fa-solid fa-pen" aria-hidden="true" /> Bearbeiten</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filteredStudents.length === 0 ? <div className="empty-state">Keine Schüler für die aktuellen Filter gefunden.</div> : null}

      {filteredStudents.length > 0 ? (
        <div className="manage-infinite-status" ref={loadMoreRef}>
          {hasMoreStudents ? (
            <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((count) => count + 40)}>Weitere Schüler anzeigen</button>
          ) : (
            <span>Alle {filteredStudents.length} Schüler sind geladen.</span>
          )}
        </div>
      ) : null}

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
