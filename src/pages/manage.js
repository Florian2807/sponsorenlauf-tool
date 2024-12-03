import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Manage.module.css';
import { formatDate } from 'utils/globalFunctions';

// TODO Link students to the database for replacement students
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
    timestamps: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  const editStudentPopup = useRef(null);
  const addStudentPopup = useRef(null);
  const confirmDeletePopup = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const response = await axios.get('/api/students');
    setStudents(response.data);
  };

  const sortStudentsFunc = (field) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);

    setStudents((prevStudents) =>
      [...prevStudents].sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];

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


  const editStudentClick = (student) => {
    setSelectedStudent(student);
    setEditVorname(student.vorname);
    setEditNachname(student.nachname);
    setEditKlasse(student.klasse);
    editStudentPopup.current.showModal();
  };

  const deleteTimestamp = (indexToRemove) => {
    const updatedTimestamps = selectedStudent.timestamps.filter((_, index) => index !== indexToRemove);
    setSelectedStudent({
      ...selectedStudent,
      timestamps: updatedTimestamps
    });
  };

  const editStudent = async (e) => {
    e.preventDefault();
    const updatedStudent = {
      id: selectedStudent.id,
      vorname: editVorname,
      nachname: editNachname,
      klasse: editKlasse,
      timestamps: selectedStudent.timestamps
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
      console.error('Fehler beim Speichern der Änderungen:', error);
    }
  };

  const deleteStudent = async () => {
    try {
      await axios.delete(`/api/students/${selectedStudent.id}`);
      setStudents(students.filter(student => student.id !== selectedStudent.id));
      setSelectedStudent(null);
      editStudentPopup.current.close();
    } catch (error) {
      console.error('Fehler beim Löschen des Schülers:', error);
    }
  };

  const addStudentClick = () => {
    const highestId = Math.max(...students.map(s => parseInt(s.id, 10)), 0);
    setNewStudent({
      id: (highestId + 1).toString(),
      vorname: '',
      nachname: '',
      klasse: '',
      timestamps: []
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
        timestamps: []
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Schülers', error);
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student?.vorname?.toLowerCase().includes(searchLower) ||
      student?.nachname?.toLowerCase().includes(searchLower) ||
      student?.klasse?.toLowerCase().includes(searchLower)
    );
  });

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

      <dialog ref={editStudentPopup} className={styles.popup}>
        <div className={styles.popupContent}>
          <button className={styles.closeButtonX} onClick={() => editStudentPopup.current.close()}>
            &times;
          </button>
          <h2>Schüler bearbeiten</h2>
          <label>ID:</label>
          <input
            type="text"
            value={selectedStudent?.id}
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
          <input
            type="text"
            value={editKlasse}
            onChange={(e) => setEditKlasse(e.target.value)}
          />

          <h3>Gelaufene Runden: {selectedStudent?.timestamps.length}</h3>
          <h3>Timestamps:</h3>
          <ul className={styles.timestampList}>
            {selectedStudent?.timestamps.map((timestamp, index) => (
              <li key={index} className={styles.timestampItem}>
                <span>{formatDate(new Date(timestamp))}</span>
                <button
                  className={styles.deleteTimestampButton}
                  onClick={() => deleteTimestamp(index)}
                >
                  Löschen
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.popupButtons}>
            <button
              className={styles.redButton}
              onClick={() => confirmDeletePopup.current.showModal()}
            >
              Schüler löschen
            </button>
            <button type="submit">Speichern</button>
          </div>
        </div>
      </dialog>

      <dialog ref={addStudentPopup} className={styles.popup}>
        <div className={styles.popupContent}>
          <button className={styles.closeButtonX} onClick={() => addStudentPopup.current.close()}>
            &times;
          </button>
          <h2>Neuen Schüler hinzufügen</h2>
          <form onSubmit={addStudentSubmit}>
            <label>ID:</label>
            <input
              type="text"
              name="id"
              value={newStudent.id}
              readOnly
            />
            <label>Vorname:</label>
            <input
              type="text"
              name="vorname"
              value={newStudent.vorname}
              onChange={addStudentChangeField}
              required
            />
            <label>Nachname:</label>
            <input
              type="text"
              name="nachname"
              value={newStudent.nachname}
              onChange={addStudentChangeField}
              required
            />
            <label>Klasse:</label>
            <input
              type="text"
              name="klasse"
              value={newStudent.klasse}
              onChange={addStudentChangeField}
              required
            />
            <div className={styles.popupButtons}>
              <button className={styles.redButton} onClick={() => addStudentPopup.current.close()}>Abbrechen</button>
              <button type="submit">Hinzufügen</button>
            </div>
          </form>
        </div>
      </dialog>

      {/* confirm-Popup */}
      <dialog ref={confirmDeletePopup} className={styles.popup}>
        <div className={styles.popupContent}>
          <button className={styles.closeButtonX} onClick={() => confirmDeletePopup.current.close()}>
            &times;
          </button>
          <h2>Bestätigen Sie das Löschen</h2>
          <p>Möchten Sie diesen Schüler wirklich löschen?</p>
          <div className={styles.popupButtons}>
            <button
              onClick={() => confirmDeletePopup.current.close()}
            >
              Abbrechen
            </button>
            <button
              onClick={() => { deleteStudent(); confirmDeletePopup.current.close(); editStudentPopup.current.close(); }}
              className={styles.redButton}
            >
              Schüler löschen
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
