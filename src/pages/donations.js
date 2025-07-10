import { useState, useEffect, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';

export default function AddDonations() {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [amount, setAmount] = useState('0,00€');
    const [message, setMessage] = useState('');
    const [studentInfo, setStudentInfo] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isSpendenMode, setIsSpendenMode] = useState(false);

    const { request, loading, error } = useApi();
    const inputRef = useRef(null);

    useEffect(() => {
        fetchStudents();
        inputRef.current.focus();
    }, []);

    const fetchStudents = async () => {
        try {
            const data = await request(API_ENDPOINTS.STUDENTS);
            setStudents(data);
        } catch (error) {
            console.error('Fehler beim Laden der Schüler:', error);
        }
    };

    const handleStudentChange = (e) => {
        const value = e.target.value;
        setSelectedStudent(value);
        setHighlightedIndex(-1);
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
        setHighlightedIndex(-1);
    };

    const handleAmountChange = (e) => {
        let value = e.target.value.replace(/[^\d]/g, '');
        if (e.nativeEvent.inputType === 'deleteContentBackward') {
            value = value.slice(0, -1);
        }
        const formattedValue = formatAmount(value);
        setAmount(formattedValue);
    };

    const formatAmount = (value) => {
        const numericValue = value.padStart(3, '0');
        let euros = numericValue.slice(0, -2);
        const cents = numericValue.slice(-2);
        euros = euros.replace(/^0+(?=\d)/, '');
        return `${euros || '0'},${cents}€`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const student = students.find(student => `${student.vorname} ${student.nachname}` === selectedStudent);
        if (!student || amount === '0,00€') {
            setMessage('Bitte wählen Sie einen Schüler und geben Sie einen gültigen Betrag ein.');
            return;
        }
        try {
            await request(API_ENDPOINTS.DONATIONS, {
                method: 'POST',
                data: {
                    studentId: student.id,
                    amount,
                    isSpendenMode
                }
            });
            setMessage(isSpendenMode ? 'Erwartete Spende erfolgreich aktualisiert.' : 'Erhaltene Spende erfolgreich hinzugefügt.');
            setSelectedStudent('');
            setAmount('0,00€');
            fetchStudentInfo(student.id);
            inputRef.current.focus();
        } catch (error) {
            console.error('Fehler beim Hinzufügen der Spende:', error);
            setMessage('Fehler beim Hinzufügen der Spende.');
        }
    };

    const fetchStudentInfo = async (studentId) => {
        try {
            const response = await request(`/api/students/${studentId}`);
            setStudentInfo(response);
        } catch (error) {
            setStudentInfo(null);
            setMessage('Schüler nicht gefunden');
        }
    };

    const handleDeleteDonation = async (donationId, type) => {
        try {
            await request(API_ENDPOINTS.DONATIONS, {
                method: 'DELETE',
                data: { donationId, type }
            });
            setMessage('Spende erfolgreich gelöscht.');
            fetchStudentInfo(studentInfo.id);
        } catch (error) {
            console.log(error);
            setMessage('Fehler beim Löschen der Spende');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setHighlightedIndex((prevIndex) =>
                prevIndex < filteredStudents.length - 1 ? prevIndex + 1 : prevIndex
            );
        } else if (e.key === 'ArrowUp') {
            setHighlightedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (highlightedIndex >= 0 && highlightedIndex < filteredStudents.length) {
                handleStudentSelect(filteredStudents[highlightedIndex]);
            }
        }
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '0,00€';
        const numericValue = parseFloat(value).toFixed(2);
        const [euros, cents] = numericValue.split('.');
        return `${euros},${cents}€`;
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Spenden hinzufügen</h1>
            <form onSubmit={handleSubmit} className="form">
                <div className="switch-container">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isSpendenMode}
                            onChange={() => setIsSpendenMode(!isSpendenMode)}
                        />
                        <span className="switch-slider"></span>
                    </label>
                </div>
                <span>{isSpendenMode ? 'Schülerliste (muss überwiesen werden)' : 'Kontoauszug (wurde bereits überwiesen)'}</span>
                <br />
                <label htmlFor="student">Schüler:</label>
                <div className="input-wrapper">
                    <input
                        type="text"
                        id="student"
                        value={selectedStudent}
                        onChange={handleStudentChange}
                        onKeyDown={handleKeyDown}
                        className="form-control"
                        autoComplete="off"
                        ref={inputRef}
                    />
                    {filteredStudents.length > 0 && (
                        <ul className="suggestions">
                            {filteredStudents.map((student, index) => (
                                <li
                                    key={student.id}
                                    onClick={() => handleStudentSelect(student)}
                                    className={`suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
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
                    className="form-control"
                />
                <button type="submit" className="btn">Hinzufügen</button>
            </form>
            {message && <p className="message message-info">{message}</p>}

            {studentInfo && (
                <div className="student-info">
                    <h2>Schüler-Informationen</h2>
                    <p><strong>Klasse:</strong> {studentInfo.klasse}</p>
                    <p><strong>Name:</strong> {studentInfo.vorname} {studentInfo.nachname}</p>
                    <p><strong>Geschlecht:</strong> {studentInfo.geschlecht || 'Nicht angegeben'}</p>
                    <p><strong>Runden:</strong> {studentInfo.timestamps.length}</p>
                    <p><strong>erwartete Spenden:</strong> {formatCurrency(studentInfo.spenden ?? 0)}</p>
                    <p><strong>erhaltene Spenden:</strong> {formatCurrency(studentInfo.spendenKonto.reduce((a, b) => a + b, 0))}</p>
                    <p><strong>Differenz:</strong> <u>{formatCurrency(studentInfo.spendenKonto.reduce((a, b) => a + b, 0) - (studentInfo.spenden ?? 0))}</u></p>

                    {studentInfo.expectedDonations && studentInfo.expectedDonations.length > 0 && (
                        <div>
                            <p><strong>Erwartete Spenden (Details):</strong></p>
                            <div className="timestamps">
                                <ul className="timestamp-list">
                                    {studentInfo.expectedDonations.map((donation) => (
                                        <li key={donation.id} className="timestamp-item">
                                            <p>{formatCurrency(donation.amount)} - {new Date(donation.created_at).toLocaleDateString()}</p>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteDonation(donation.id, 'expected')}
                                            >
                                                Löschen
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {studentInfo.receivedDonations && studentInfo.receivedDonations.length > 0 && (
                        <div>
                            <p><strong>Erhaltene Spenden (Details):</strong></p>
                            <div className="timestamps">
                                <ul className="timestamp-list">
                                    {studentInfo.receivedDonations.map((donation) => (
                                        <li key={donation.id} className="timestamp-item">
                                            <p>{formatCurrency(donation.amount)} - {new Date(donation.created_at).toLocaleDateString()}</p>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteDonation(donation.id, 'received')}
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
            )}
        </div>
    );
}