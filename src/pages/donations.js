// src/pages/donations.js
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/Donations.module.css';

export default function AddDonations() {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [amount, setAmount] = useState('0,00€');
    const [message, setMessage] = useState('');
    const [studentInfo, setStudentInfo] = useState(null);
    const [currentTimestamp, setCurrentTimestamp] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchStudents();
        inputRef.current.focus(); // Setze den Fokus auf das Schüler-Eingabefeld
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Fehler beim Laden der Schüler:', error);
        }
    };

    const handleStudentChange = (e) => {
        const value = e.target.value;
        setSelectedStudent(value);
        setHighlightedIndex(-1); // Setze den hervorgehobenen Index zurück
        if (value) {
            const filtered = students.filter(student =>
                `${student.vorname} ${student.nachname}`.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents([]);
        }
    };

    const handleStudentSelect = (student) => {
        setSelectedStudent(`${student.vorname} ${student.nachname}`);
        setFilteredStudents([]);
        setHighlightedIndex(-1); // Rücksetzen des hervorgehobenen Index
    };

    const handleAmountChange = (e) => {
        let value = e.target.value.replace(/[^\d]/g, ''); // Entferne alle nicht-numerischen Zeichen
        if (e.nativeEvent.inputType === 'deleteContentBackward') {
            value = value.slice(0, -1); // Entferne die letzte Zahl
        }
        const formattedValue = formatAmount(value);
        setAmount(formattedValue);
    };

    const formatAmount = (value) => {
        const numericValue = value.padStart(3, '0'); // Füge führende Nullen hinzu, um mindestens 3 Zeichen zu haben
        let euros = numericValue.slice(0, -2); // Alles außer den letzten beiden Zeichen sind Euros
        const cents = numericValue.slice(-2); // Die letzten beiden Zeichen sind Cents

        // Entferne führende Nullen bei Euros, wenn weiter vorne keine andere Zahl als 0 kommt
        euros = euros.replace(/^0+(?=\d)/, '');

        return `${euros || '0'},${cents}€`; // Formatieren als 00,00€
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const student = students.find(student => `${student.vorname} ${student.nachname}` === selectedStudent);
        if (!student || amount === '0,00€') {
            setMessage('Bitte wählen Sie einen Schüler und geben Sie einen gültigen Betrag ein.');
            return;
        }
        try {
            await axios.post('/api/donations', { studentId: student.id, amount });
            setMessage('Spende erfolgreich hinzugefügt.');
            setSelectedStudent('');
            setAmount('0,00€');
            fetchStudentInfo(student.id); // Aktualisiere die Schülerinformationen
            inputRef.current.focus(); // Setze den Fokus zurück auf das Schüler-Eingabefeld
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Spende:', error);
            setMessage('Fehler beim Hinzufügen der Spende.');
        }
    };

    const fetchStudentInfo = async (studentId) => {
        try {
            const response = await axios.get(`/api/students/${studentId}`);
            if (response.status === 200) {
                setStudentInfo({
                    ...response.data,
                    spenden: response.data.spenden ? JSON.parse(response.data.spenden) : []
                });
                setCurrentTimestamp(new Date());
            } else {
                setStudentInfo(null);
                setMessage('Schüler nicht gefunden');
            }
        } catch (error) {
            setStudentInfo(null);
            setMessage('Schüler nicht gefunden');
        }
    };

    const handleDeleteDonation = async (indexToRemove) => {
        const updatedDonations = studentInfo.spenden.filter((_, index) => index !== indexToRemove);
        try {
            console.log(updatedDonations)
            await axios.put(`/api/students/${studentInfo.id}`, { spenden: updatedDonations })

            setStudentInfo((prevStudentInfo) => ({
                ...prevStudentInfo,
                spenden: updatedDonations,
            }));
        } catch (error) {
            console.log(error)
            setMessage('Fehler beim Löschen der Spende');
        }
    };

    // Funktion zum Navigieren mit den Pfeiltasten
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            // Pfeiltaste nach unten
            setHighlightedIndex((prevIndex) =>
                prevIndex < filteredStudents.length - 1 ? prevIndex + 1 : prevIndex
            );
        } else if (e.key === 'ArrowUp') {
            // Pfeiltaste nach oben
            setHighlightedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            // Auswahl mit Enter oder Tab
            if (highlightedIndex >= 0 && highlightedIndex < filteredStudents.length) {
                handleStudentSelect(filteredStudents[highlightedIndex]);
            }
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Spenden hinzufügen</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <label htmlFor="student">Schüler:</label>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        id="student"
                        value={selectedStudent}
                        onChange={handleStudentChange}
                        onKeyDown={handleKeyDown}
                        className={styles.input}
                        autoComplete="off"
                        ref={inputRef}
                    />
                    {filteredStudents.length > 0 && (
                        <ul className={styles.suggestions}>
                            {filteredStudents.map((student, index) => (
                                <li
                                    key={student.id}
                                    onClick={() => handleStudentSelect(student)}
                                    className={`${styles.suggestionItem} ${highlightedIndex === index ? styles.highlighted : ''}`}
                                >
                                    {student.vorname} {student.nachname} ({student.klasse})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <label htmlFor="amount">Betrag:</label>
                <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>Hinzufügen</button>
            </form>
            {message && <p className={styles.message}>{message}</p>}

            {studentInfo && (
                <div className={styles.studentInfo}>
                    <h2>Schüler-Informationen</h2>
                    <p><strong>Klasse:</strong> {studentInfo.klasse}</p>
                    <p><strong>Name:</strong> {studentInfo.vorname} {studentInfo.nachname}</p>
                    <p><strong>Runden:</strong> {studentInfo.timestamps.length}</p>
                    <p><strong>Spenden:</strong></p>
                    <div className={styles.timestamps}>
                        <ul className={styles.timestampList}>
                            {studentInfo.spenden.map((donation, index) => (
                                <li key={index} className={styles.timestampItem}>
                                    <span>{`${donation.replace('.', ',')}€`}</span>
                                    <button
                                        type="button"
                                        className={styles.deleteTimestampButton}
                                        onClick={() => handleDeleteDonation(index)}
                                    >
                                        Löschen
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}