import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import LiveFilterMenu from '../components/LiveFilterMenu';
import { groupClassesByGrade } from '../utils/classFilterGroups';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useStudentDirectory } from '../hooks/useStudentDirectory';
import { useRoundHistory } from '../hooks/useRoundHistory';
import EditStudentDialog from '../components/dialogs/manage/EditStudentDialog';
import AddReplacementDialog from '../components/dialogs/manage/AddReplacementDialog';
import { normalizeReplacementId } from '../utils/studentId';
import { createClientId } from '../utils/clientId';
import AddStudentDialog from '../components/dialogs/manage/AddStudentDialog';
import ConfirmDeleteDialog from '../components/dialogs/manage/ConfirmDeleteDialog';

export default function Manage() {
  const router = useRouter();
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
  const [classStructure, setClassStructure] = useState({});
  const [classFilter, setClassFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const sortData = field => { setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'); setSortField(field); };
  const directory = useStudentDirectory({ search: searchTerm, klasse: classFilter.startsWith('class:') ? classFilter.slice(6) : 'all', grade: classFilter.startsWith('grade:') ? classFilter.slice(6) : '', filter: roundFilter, sort: sortField, direction: sortDirection });
  const { students, setStudents, hasMore: hasMoreStudents, loadMore, refresh: fetchStudents } = directory;
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useRoundHistory(selectedStudent?.id, `${selectedStudent?.roundCount}:${selectedStudent?.roundVersion}`, historyOpen);

  const { request, loading } = useApi();
  const { showError, showSuccess } = useGlobalError();

  const searchRef = useRef(null);
  const editStudentPopup = useRef(null);
  const addStudentPopup = useRef(null);
  const confirmDeletePopup = useRef(null);
  const addReplacementPopup = useRef(null);
  const openedStudentQueryRef = useRef(null);

  const fetchAvailableClasses = useCallback(async () => {
    try {
      const [classes, structure] = await Promise.all([
        request(API_ENDPOINTS.CLASSES, { cacheMs: 30000 }), request('/api/classStructure'),
      ]);
      setAvailableClasses(classes);
      setClassStructure(structure);
    } catch (error) {
      showError(error, 'Beim Laden der verfügbaren Klassen');
    }
  }, [request, showError]);

  useEffect(() => { fetchAvailableClasses(); }, [fetchAvailableClasses]);
  const visibleStudents = students;
  const classGroups = groupClassesByGrade(availableClasses, classStructure).map(group => ({
    label: group.label,
    option: { value: `grade:${group.grade}`, label: group.label, shortLabel: 'Gesamte Stufe' },
    options: group.classes.map(name => ({ value: `class:${name}`, label: `Klasse ${name}`, shortLabel: name })),
  }));

  const activeFilterCount = [
    classFilter !== 'all',
    roundFilter !== 'all',
  ].filter(Boolean).length;

  const editStudentClick = useCallback((student) => {
    setSelectedStudent(student);
    setHistoryOpen(false);
    setEditForm({
      vorname: student.vorname,
      nachname: student.nachname,
      klasse: student.klasse,
      geschlecht: student.geschlecht || 'männlich'
    });
    editStudentPopup.current.showModal();
  }, []);

  useEffect(() => {
    const requested = router.query.student;
    if (!router.isReady || typeof requested !== 'string' || !/^\d+$/.test(requested) || openedStudentQueryRef.current === requested) return;
    const existing = students.find(student => String(student.id) === requested);
    if (existing) { openedStudentQueryRef.current = requested; editStudentClick(existing); return; }
    let cancelled = false;
    request(`/api/getAllStudents?view=student&id=${requested}`).then(student => {
      if (!cancelled && student) { openedStudentQueryRef.current = requested; editStudentClick(student); }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [editStudentClick, router.isReady, router.query.student, students, request]);

  const deleteTimestamp = useCallback(async (roundId) => {
    if (!selectedStudent) return;

    try {
      await request(`/api/rounds/${roundId}`, {
        method: 'DELETE',
        data: { studentId: selectedStudent.id },
        errorContext: 'Beim Löschen der Runde'
      });

      setSelectedStudent(current => ({ ...current, roundCount: Math.max(0, current.roundCount - 1) }));
      history.reload(); fetchStudents();
      showSuccess('Runde erfolgreich gelöscht');
    } catch (error) {
      // Fehler wird automatisch über useApi angezeigt.
    }
  }, [request, selectedStudent, showSuccess, history, fetchStudents]);

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
        setSelectedStudent(prev => ({ ...prev, roundCount: response.student.roundCount }));
        history.reload(); fetchStudents();

        showSuccess('Runde erfolgreich hinzugefügt');
        setMessage('');
      }
    } catch (error) {
      showError(error, 'Beim Hinzufügen der Runde');
      setMessage('Fehler beim Hinzufügen der Runde');
    }
  }, [selectedStudent, request, showError, showSuccess, history, fetchStudents]);

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
          if (roundFilter === 'with-replacements') fetchStudents();
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
          if (roundFilter === 'with-replacements') fetchStudents();
        }
      }
    } catch (error) {
      if (error.status === 409) {
        setMessage('Diese Ersatz-ID ist bereits vergeben');
      } else {
        showError(error, 'Beim Erstellen der Ersatz-ID');
      }
    }
  }, [request, selectedStudent, newReplacement, showError, setStudents, roundFilter, fetchStudents]);

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
      if (roundFilter === 'with-replacements') fetchStudents();
    } catch (error) {
      showError(error, 'Beim Löschen der Ersatz-ID');
    }
  }, [request, selectedStudent, showError, setStudents, roundFilter, fetchStudents]);

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
        fetchStudents();
        showSuccess('Schüler erfolgreich gespeichert', 'Schüler bearbeiten');
      }
    } catch (error) {
      // Fehler wird automatisch über useApi gehandelt
    }
  }, [request, selectedStudent, editForm, showSuccess, setStudents, fetchStudents]);

  const deleteStudent = useCallback(async () => {
    if (!selectedStudent) return;

    try {
      const result = await request(`/api/students/${selectedStudent.id}`, { method: 'DELETE' });
      setStudents(prev => prev.filter(student => student.id !== selectedStudent.id));
      setSelectedStudent(null);
      editStudentPopup.current?.close();
      fetchStudents();
      showSuccess(`Schüler gelöscht. Sicherheitskopie: ${result.backupFilename}`, 'Schüler löschen');
    } catch (error) {
      showError(error, 'Beim Löschen des Schülers');
    }
  }, [request, selectedStudent, showError, showSuccess, fetchStudents, setStudents]);

  const addStudentClick = () => {
    setNewStudent({
      id: String(directory.nextId),
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
      fetchStudents();
      showSuccess('Schüler erfolgreich hinzugefügt', 'Schüler hinzufügen');
    } catch (error) {
      // Fehler wird automatisch über useApi gehandelt
    }
  }, [request, newStudent, showSuccess, fetchStudents, setStudents]);

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
        <div className="live-search">
          <label className="sr-only" htmlFor="manage-search">Suchen</label>
          <i className="fa-solid fa-magnifying-glass live-search-icon" aria-hidden="true" />
          <input ref={searchRef} id="manage-search" type="search" placeholder="Schüler suchen · Name, Klasse oder ID"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control"
            maxLength={100} autoComplete="off" />
          {searchTerm && <button type="button" className="live-search-clear" aria-label="Suche leeren"
            onClick={() => { setSearchTerm(''); searchRef.current?.focus(); }}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>}
        </div>
        <div className="manage-filter-field manage-class-filter">
          <LiveFilterMenu label="Klasse" icon="fa-users" value={classFilter} onChange={setClassFilter}
            options={[{ value: 'all', label: 'Alle Klassen' }]} groups={classGroups} />
        </div>
        <div className="manage-filter-field manage-status-filter">
          <LiveFilterMenu label="Status" icon="fa-list-check" value={roundFilter} onChange={setRoundFilter}
            options={[
              { value: 'all', label: 'Alle Schüler' },
              { value: 'with-rounds', label: 'Mit Runden' },
              { value: 'no-rounds', label: 'Ohne Runden' },
              { value: 'with-replacements', label: 'Mit Ersatz-ID' },
            ]} />
        </div>
        {(activeFilterCount > 0 || searchTerm) && (
          <button type="button" className="btn btn-secondary student-filter-reset" onClick={() => { clearFilters(); setSearchTerm(''); }}>Zurücksetzen</button>
        )}
        <label className="manage-filter-field student-mobile-sort">
          <span>Sortieren</span>
          <select className="form-select" value={sortField} onChange={(e) => sortData(e.target.value)}>
            <option value="id">ID</option><option value="klasse">Klasse</option>
            <option value="vorname">Vorname</option><option value="nachname">Nachname</option>
            <option value="geschlecht">Geschlecht</option><option value="roundCount">Runden</option>
          </select>
        </label>
        <button type="button" className="btn btn-secondary student-mobile-sort-direction" onClick={() => sortData(sortField)}>
          <i className={`fa-solid fa-arrow-${sortDirection === 'asc' ? 'up' : 'down'}`} aria-hidden="true" />
          {sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
        </button>
        <div className="student-list-count" role="status">
          <strong>{directory.filtered}</strong> von {directory.total} Schülern
        </div>
      </div>

      {directory.error && <p role="alert">{directory.error} <button type="button" onClick={fetchStudents}>Erneut versuchen</button></p>}
      {directory.loading && students.length === 0 ? <div className="message message-info">Schülerdaten werden geladen...</div> : null}

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
              <th aria-sort={sortField === 'roundCount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className={`table-sort-button sortable ${sortField === 'roundCount' ? sortDirection : ''}`} onClick={() => sortData('roundCount')}>Runden</button>
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
                <td><span className="student-round-count">{student.roundCount || 0}</span><span className="student-mobile-round-label"> Runden</span></td>
                <td>
                  <button type="button" className="btn btn-secondary btn-sm" aria-label={`${student.vorname} ${student.nachname} bearbeiten`} onClick={() => editStudentClick(student)}><i className="fa-solid fa-pen" aria-hidden="true" /> Bearbeiten</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!directory.loading && directory.filtered === 0 ? <div className="empty-state">Keine Schüler für die aktuellen Filter gefunden.</div> : null}

      {directory.filtered > 0 ? (
        <div className="live-load-more manage-pagination" role="group" aria-label="Weitere Schüler" aria-busy={directory.loading}>
          <span role="status">{directory.loading ? 'Lade Schüler…'
            : hasMoreStudents ? `${students.length} von ${directory.filtered} Schülern geladen`
              : `Alle ${directory.filtered} Schüler geladen`}</span>
          {hasMoreStudents && <button type="button" disabled={directory.loading} onClick={loadMore}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> {directory.loading ? 'Lade Schüler…' : '200 weitere laden'}
          </button>}
        </div>
      ) : null}

      <EditStudentDialog
        dialogRef={editStudentPopup}
        selectedStudent={selectedStudent ? { ...selectedStudent, rounds: history.rounds } : null}
        historyOpen={historyOpen}
        setHistoryOpen={setHistoryOpen}
        historyLoading={history.loading}
        historyError={history.error}
        reloadHistory={history.reload}
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
