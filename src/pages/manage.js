import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const [classFilter, setClassFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
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
    <div className="page-container-extra-wide manage-page">
      <div className="manage-header">
        <div className="manage-header-main">
          <div className="manage-header-intro">
            <h1 className="page-title">Schüler verwalten</h1>
          </div>

          <div className="manage-header-actions">
            <button className="btn" onClick={addStudentClick}>Schüler hinzufügen</button>
            <button
              type="button"
              className={`btn btn-secondary ${showFilters ? 'manage-filter-toggle-active' : ''}`}
              onClick={() => setShowFilters((currentValue) => !currentValue)}
              aria-expanded={showFilters}
              aria-controls="manage-filters-panel"
            >
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>

        <div className="manage-header-search-row">
          <div className="manage-results-summary">
            <strong>{filteredStudents.length}</strong> Ergebnisse
            {searchTerm.trim() ? ` fuer "${searchTerm}"` : ''}
          </div>

          <div className="manage-search-box manage-search-box-edge">
            <label className="sr-only" htmlFor="manage-search">Schüler suchen</label>
            <input
              id="manage-search"
              type="text"
              placeholder="Name, Klasse oder ID suchen"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {showFilters ? (
        <div id="manage-filters-panel" className="manage-filters-panel">
          <div className="manage-filter-row">
          <label className="manage-filter-field">
            <span>Klasse</span>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="form-select">
              <option value="all">Alle Klassen</option>
              {availableClasses.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
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

          <div className="manage-results-summary">
            <strong>{filteredStudents.length}</strong> Ergebnisse
            {activeFilterCount > 0 ? ` · ${activeFilterCount} Filter aktiv` : ' · Keine Filter aktiv'}
          </div>

          {activeFilterCount > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>Filter zurücksetzen</button>
          ) : null}
          </div>
        </div>
      ) : null}

      {loading && students.length === 0 ? <div className="message message-info">Schülerdaten werden geladen...</div> : null}

      <div className="table-responsive">
        <table className="table">
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
      </div>

      {!loading && filteredStudents.length === 0 ? <div className="empty-state">Keine Schüler für die aktuellen Filter gefunden.</div> : null}

      {filteredStudents.length > 0 ? (
        <div className="manage-infinite-status" ref={loadMoreRef}>
          {hasMoreStudents ? (
            <span>Weitere Schüler werden beim Scrollen automatisch geladen...</span>
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
