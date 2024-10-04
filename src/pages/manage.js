import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Manage.module.css';
import { formatDate } from 'utils/globalFunctions';

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
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const response = await axios.get('/api/students');
    setStudents(response.data);
  };
  
  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    
    setStudents((prevStudents) =>
      [...prevStudents].sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        // Überprüfe, ob das Feld 'id' ist und wandle es zu Zahlen für numerische Sortierung
        if (field === 'id') {
          return direction === 'asc'
            ? parseInt(aValue) - parseInt(bValue)
            : parseInt(bValue) - parseInt(aValue);
        }
  
        // Standardmäßige String-Sortierung für andere Felder
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      })
    );
  };
  

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditVorname(student.vorname);
    setEditNachname(student.nachname);
    setEditKlasse(student.klasse);
    setShowEditPopup(true);
  };

  const handleDeleteTimestamp = (indexToRemove) => {
    const updatedTimestamps = selectedStudent.timestamps.filter((_, index) => index !== indexToRemove);
    setSelectedStudent({
      ...selectedStudent,
      timestamps: updatedTimestamps
    });
  };

  const handleEditStudent = async (e) => {
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
        setShowEditPopup(false);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Änderungen:', error);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await axios.delete(`/api/students/${selectedStudent.id}`);
      setStudents(students.filter(student => student.id !== selectedStudent.id));
      setSelectedStudent(null);
      setShowEditPopup(false);
    } catch (error) {
      console.error('Fehler beim Löschen des Schülers:', error);
    }
  };

  const handleAddClick = () => {
    const highestId = Math.max(...students.map(s => parseInt(s.id, 10)), 0);
    setNewStudent({
      id: (highestId + 1).toString(),
      vorname: '',
      nachname: '',
      klasse: '',
      timestamps: []
    });
    setShowAddPopup(true);
  };

  const handleAddChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/students/${newStudent.id}`, newStudent);
      fetchStudents();
      setShowAddPopup(false);
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
      <button onClick={handleAddClick} className={styles.addButton}>Schüler hinzufügen</button>
      <div className={styles.searchContainer}>
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
            <th className={`${styles.sortable} ${sortField === 'id' ? styles[sortDirection] : ''}`} onClick={() => handleSort('id')}>ID</th>
            <th className={`${styles.sortable} ${sortField === 'klasse' ? styles[sortDirection] : ''}`} onClick={() => handleSort('klasse')}>Klasse</th>
            <th className={`${styles.sortable} ${sortField === 'vorname' ? styles[sortDirection] : ''}`} onClick={() => handleSort('vorname')}>Vorname</th>
            <th className={`${styles.sortable} ${sortField === 'nachname' ? styles[sortDirection] : ''}`} onClick={() => handleSort('nachname')}>Nachname</th>
            <th className={`${styles.sortable} ${sortField === 'timestamps' ? styles[sortDirection] : ''}`} onClick={() => handleSort('timestamps')}>Runden</th>
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
                <button onClick={() => handleEditClick(student)}>Bearbeiten</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEditPopup && selectedStudent && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <button className={styles.closeButton} onClick={() => setShowEditPopup(false)}>X</button>
            <h2>Schüler bearbeiten</h2>
            <form onSubmit={handleEditStudent}>
              <label>ID:</label>
              <input
                type="text"
                value={selectedStudent.id}
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

              <h3>Gelaufene Runden: {selectedStudent.timestamps.length}</h3>
              <h3>Timestamps:</h3>
              <ul className={styles.timestampList}>
                {selectedStudent.timestamps.map((timestamp, index) => (
                  <li key={index} className={styles.timestampItem}>
                    <span>{formatDate(new Date(timestamp))}</span>
                    <button
                      type="button"
                      className={styles.deleteTimestampButton}
                      onClick={() => handleDeleteTimestamp(index)}
                    >
                      Löschen
                    </button>
                  </li>
                ))}
              </ul>

              <div className={styles.popupButtons}>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleDeleteStudent}
                >
                  Löschen
                </button>
                <button type="submit" className={styles.saveButton}>Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <button className={styles.closeButton} onClick={() => setShowAddPopup(false)}>×</button>
            <h2>Neuen Schüler hinzufügen</h2>
            <form onSubmit={handleAddSubmit}>
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
                onChange={handleAddChange}
                required
              />
              <label>Nachname:</label>
              <input
                type="text"
                name="nachname"
                value={newStudent.nachname}
                onChange={handleAddChange}
                required
              />
              <label>Klasse:</label>
              <input
                type="text"
                name="klasse"
                value={newStudent.klasse}
                onChange={handleAddChange}
                required
              />
              <div className={styles.popupButtons}>
                <button type="button" className={styles.closeButton} onClick={() => setShowAddPopup(false)}>Abbrechen</button>
                <button type="submit" className={styles.saveButton}>Hinzufügen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
