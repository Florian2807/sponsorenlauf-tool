import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';

export default function AddDonations() {
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [studentInfo, setStudentInfo] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isSpendenMode, setIsSpendenMode] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { request, loading } = useApi();
    const searchInputRef = useRef(null);
    const amountInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Optimierte Filterung mit useMemo für bessere Performance
    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase().trim();
        return students
            .filter(student => {
                const fullName = `${student.vorname} ${student.nachname}`.toLowerCase();
                const className = student.klasse.toLowerCase();
                return fullName.includes(query) || className.includes(query);
            })
            .slice(0, 10) // Limitiere auf 10 Ergebnisse für bessere Performance
            .sort((a, b) => {
                // Sortiere nach Relevanz: Exact match > Starts with > Contains
                const aName = `${a.vorname} ${a.nachname}`.toLowerCase();
                const bName = `${b.vorname} ${b.nachname}`.toLowerCase();

                if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
                if (!aName.startsWith(query) && bName.startsWith(query)) return 1;
                return aName.localeCompare(bName);
            });
    }, [students, searchQuery]);

    useEffect(() => {
        fetchStudents();
        searchInputRef.current?.focus();
    }, []);

    // Schließe Dropdown wenn außerhalb geklickt wird
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStudents = async () => {
        try {
            const data = await request(API_ENDPOINTS.STUDENTS);
            setStudents(data);
        } catch (error) {
            console.error('Fehler beim Laden der Schüler:', error);
            setMessage('Fehler beim Laden der Schülerdaten.');
        }
    };

    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setSelectedStudent(null);
        setHighlightedIndex(-1);
        setIsDropdownOpen(value.length > 0);

        // Verstecke Schüler-Info wenn neuer Search beginnt
        if (value !== '' && studentInfo) {
            setStudentInfo(null);
        }
    }, [studentInfo]);

    const handleStudentSelect = useCallback((student) => {
        setSelectedStudent(student);
        setSearchQuery(`${student.vorname} ${student.nachname}`);
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);

        // Fokus auf Betrag-Input
        setTimeout(() => amountInputRef.current?.focus(), 0);

        // Lade sofort Schüler-Info
        fetchStudentInfo(student.id);
    }, []);

    const handleAmountChange = useCallback((e) => {
        const value = e.target.value;

        // Erlaube nur Zahlen, Kommas und Punkte
        const cleanValue = value.replace(/[^\d,.-]/g, '');

        // Konvertiere Punkt zu Komma für deutsche Eingabe
        const normalizedValue = cleanValue.replace('.', ',');

        setAmount(normalizedValue);
    }, []);

    const parseAmount = (amountString) => {
        if (!amountString) return 0;

        // Entferne alle Zeichen außer Zahlen und dem letzten Komma
        const cleaned = amountString.replace(/[^\d,]/g, '');
        const parts = cleaned.split(',');

        if (parts.length === 1) {
            // Nur Euros eingegeben
            return parseFloat(parts[0] || '0');
        } else if (parts.length === 2) {
            // Euros und Cents eingegeben
            const euros = parts[0] || '0';
            const cents = parts[1].padEnd(2, '0').substring(0, 2);
            return parseFloat(`${euros}.${cents}`);
        }

        return 0;
    };

    const formatCurrencyInput = (value) => {
        const num = parseAmount(value);
        return num.toFixed(2).replace('.', ',');
    };

    const validateForm = () => {
        if (!selectedStudent) {
            setMessage('Bitte wählen Sie einen Schüler aus.');
            searchInputRef.current?.focus();
            return false;
        }

        const amountNum = parseAmount(amount);
        if (amountNum <= 0) {
            setMessage('Bitte geben Sie einen gültigen Betrag ein.');
            amountInputRef.current?.focus();
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setMessage('');

        try {
            const amountNum = parseAmount(amount);
            await request(API_ENDPOINTS.DONATIONS, {
                method: 'POST',
                data: {
                    studentId: selectedStudent.id,
                    amount: formatCurrencyDisplay(amountNum),
                    isSpendenMode
                }
            });

            const successMessage = isSpendenMode
                ? 'Erwartete Spende erfolgreich aktualisiert.'
                : 'Erhaltene Spende erfolgreich hinzugefügt.';
            setMessage(successMessage);

            // Reset Form
            setSearchQuery('');
            setSelectedStudent(null);
            setAmount('');

            // Aktualisiere Schüler-Info
            await fetchStudentInfo(selectedStudent.id);

            // Fokus zurück auf Schüler-Eingabe
            setTimeout(() => searchInputRef.current?.focus(), 100);

        } catch (error) {
            console.error('Fehler beim Hinzufügen der Spende:', error);
            setMessage('Fehler beim Hinzufügen der Spende.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchStudentInfo = async (studentId) => {
        try {
            const response = await request(`/api/students/${studentId}`);
            setStudentInfo(response);
        } catch (error) {
            console.error('Fehler beim Laden der Schüler-Info:', error);
        }
    };

    const handleDeleteDonation = async (donationId, type) => {
        if (!confirm('Sind Sie sicher, dass Sie diese Spende löschen möchten?')) {
            return;
        }

        try {
            await request(API_ENDPOINTS.DONATIONS, {
                method: 'DELETE',
                data: { donationId, type }
            });
            setMessage('Spende erfolgreich gelöscht.');
            await fetchStudentInfo(studentInfo.id);
        } catch (error) {
            console.error('Fehler beim Löschen der Spende:', error);
            setMessage('Fehler beim Löschen der Spende.');
        }
    };

    const handleKeyDown = useCallback((e) => {
        if (!isDropdownOpen || filteredStudents.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredStudents.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredStudents.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredStudents.length) {
                    handleStudentSelect(filteredStudents[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsDropdownOpen(false);
                setHighlightedIndex(-1);
                break;
            case 'Tab':
                if (highlightedIndex >= 0 && highlightedIndex < filteredStudents.length) {
                    e.preventDefault();
                    handleStudentSelect(filteredStudents[highlightedIndex]);
                }
                break;
        }
    }, [isDropdownOpen, filteredStudents, highlightedIndex, handleStudentSelect]);

    const formatCurrencyDisplay = (value) => {
        if (value === null || value === undefined || isNaN(value)) return '0,00€';
        return `${value.toFixed(2).replace('.', ',')}€`;
    };

    const calculateDifference = (received, expected) => {
        const diff = received - expected;
        return {
            value: diff,
            formatted: formatCurrencyDisplay(Math.abs(diff)),
            isPositive: diff >= 0
        };
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Spenden verwalten</h1>

            {/* Mode Toggle */}
            <div className="form-section">
                <div className="mode-toggle">
                    <div className="switch-container">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={isSpendenMode}
                                onChange={(e) => setIsSpendenMode(e.target.checked)}
                            />
                            <span className="switch-slider"></span>
                        </label>
                        <span className="mode-label">
                            {isSpendenMode
                                ? '📋 Erwartete Spenden (Schülerliste)'
                                : '💰 Erhaltene Spenden (Kontoauszug)'}
                        </span>
                    </div>
                    <p className="mode-description">
                        {isSpendenMode
                            ? 'Erfassen Sie erwartete Spenden basierend auf der Schülerliste'
                            : 'Erfassen Sie bereits erhaltene Spenden aus dem Kontoauszug'}
                    </p>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="donation-form">
                <div className="form-grid">
                    {/* Student Search */}
                    <div className="form-group">
                        <label htmlFor="student" className="form-label">
                            🔍 Schüler suchen:
                        </label>
                        <div className="student-search" ref={dropdownRef}>
                            <input
                                type="text"
                                id="student"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery && setIsDropdownOpen(true)}
                                className={`form-control ${selectedStudent ? 'has-selection' : ''}`}
                                placeholder="Name oder Klasse eingeben..."
                                autoComplete="off"
                                ref={searchInputRef}
                                disabled={loading}
                            />

                            {selectedStudent && (
                                <div className="selected-student">
                                    ✅ {selectedStudent.vorname} {selectedStudent.nachname}
                                    <span className="student-class">({selectedStudent.klasse})</span>
                                </div>
                            )}

                            {isDropdownOpen && filteredStudents.length > 0 && (
                                <div className="suggestions-dropdown">
                                    {filteredStudents.map((student, index) => (
                                        <div
                                            key={student.id}
                                            onClick={() => handleStudentSelect(student)}
                                            className={`suggestion-item ${highlightedIndex === index ? 'highlighted' : ''
                                                }`}
                                        >
                                            <div className="student-name">
                                                {student.vorname} {student.nachname}
                                            </div>
                                            <div className="student-details">
                                                Klasse {student.klasse}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="form-group">
                        <label htmlFor="amount" className="form-label">
                            💶 Betrag:
                        </label>
                        <div className="amount-input-wrapper">
                            <input
                                type="text"
                                id="amount"
                                value={amount}
                                onChange={handleAmountChange}
                                onBlur={(e) => {
                                    if (e.target.value) {
                                        setAmount(formatCurrencyInput(e.target.value));
                                    }
                                }}
                                className="form-control amount-input"
                                placeholder="0,00"
                                ref={amountInputRef}
                                disabled={loading || isSubmitting}
                            />
                            <span className="currency-symbol">€</span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                    <button
                        type="submit"
                        className={`btn btn-primary btn-lg ${isSubmitting ? 'loading' : ''}`}
                        disabled={loading || isSubmitting || !selectedStudent || !amount}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading-spinner"></span>
                                Wird gespeichert...
                            </>
                        ) : (
                            <>
                                {isSpendenMode ? '📝 Erwartung erfassen' : '💰 Spende hinzufügen'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Messages */}
            {message && (
                <div className={`message ${message.includes('erfolgreich') ? 'message-success' :
                    message.includes('Fehler') ? 'message-error' : 'message-info'
                    }`}>
                    {message}
                </div>
            )}

            {/* Student Info */}
            {studentInfo && (
                <div className="student-info-card">
                    <div className="student-header">
                        <h2>📊 Übersicht: {studentInfo.vorname} {studentInfo.nachname}</h2>
                        <span className="student-class-badge">{studentInfo.klasse}</span>
                    </div>

                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">🏃‍♂️ Gelaufene Runden:</span>
                            <span className="info-value">{studentInfo.timestamps?.length || 0}</span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">📋 Erwartete Spenden:</span>
                            <span className="info-value expected">
                                {formatCurrencyDisplay(studentInfo.spenden ?? 0)}
                            </span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">💰 Erhaltene Spenden:</span>
                            <span className="info-value received">
                                {formatCurrencyDisplay(
                                    studentInfo.spendenKonto?.reduce((a, b) => a + b, 0) ?? 0
                                )}
                            </span>
                        </div>

                        <div className="info-item difference">
                            <span className="info-label">📈 Differenz:</span>
                            <span className={`info-value ${calculateDifference(
                                studentInfo.spendenKonto?.reduce((a, b) => a + b, 0) ?? 0,
                                studentInfo.spenden ?? 0
                            ).isPositive ? 'positive' : 'negative'
                                }`}>
                                {calculateDifference(
                                    studentInfo.spendenKonto?.reduce((a, b) => a + b, 0) ?? 0,
                                    studentInfo.spenden ?? 0
                                ).isPositive ? '+' : '-'}
                                {calculateDifference(
                                    studentInfo.spendenKonto?.reduce((a, b) => a + b, 0) ?? 0,
                                    studentInfo.spenden ?? 0
                                ).formatted}
                            </span>
                        </div>
                    </div>

                    {/* Donation Details */}
                    <div className="donations-details">
                        {studentInfo.expectedDonations && studentInfo.expectedDonations.length > 0 && (
                            <div className="donation-section">
                                <h3>📋 Erwartete Spenden</h3>
                                <div className="donation-list">
                                    {studentInfo.expectedDonations.map((donation) => (
                                        <div key={donation.id} className="donation-item expected">
                                            <div className="donation-info">
                                                <span className="amount">{formatCurrencyDisplay(donation.amount)}</span>
                                                <span className="date">
                                                    {new Date(donation.created_at).toLocaleDateString('de-DE')}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteDonation(donation.id, 'expected')}
                                                title="Spende löschen"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {studentInfo.receivedDonations && studentInfo.receivedDonations.length > 0 && (
                            <div className="donation-section">
                                <h3>💰 Erhaltene Spenden</h3>
                                <div className="donation-list">
                                    {studentInfo.receivedDonations.map((donation) => (
                                        <div key={donation.id} className="donation-item received">
                                            <div className="donation-info">
                                                <span className="amount">{formatCurrencyDisplay(donation.amount)}</span>
                                                <span className="date">
                                                    {new Date(donation.created_at).toLocaleDateString('de-DE')}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteDonation(donation.id, 'received')}
                                                title="Spende löschen"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}