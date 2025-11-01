import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import styles from '../styles/Donations.module.css';

export default function AddDonations() {
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [studentInfo, setStudentInfo] = useState(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isSpendenMode, setIsSpendenMode] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { request, loading } = useApi();
    const { showError } = useGlobalError();
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
            showError(error, 'Beim Laden der Schüler');
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

        // Fokus direkt auf Betrag-Input
        amountInputRef.current?.focus();

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
            showError(error, 'Beim Hinzufügen der Spende');
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
            showError(error, 'Beim Laden der Schüler-Info');
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
            showError(error, 'Beim Löschen der Spende');
            setMessage('Fehler beim Löschen der Spende.');
        }
    };

    const handleKeyDown = useCallback((e) => {
        if (!isDropdownOpen && e.key === 'Enter' && searchQuery && filteredStudents.length > 0) {
            // Wenn Dropdown geschlossen ist, aber es gibt Suchergebnisse, wähle das erste
            e.preventDefault();
            handleStudentSelect(filteredStudents[0]);
            return;
        }

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
                if (highlightedIndex === -1 && filteredStudents.length > 0) {
                    // Wenn kein Element hervorgehoben ist, wähle das erste
                    handleStudentSelect(filteredStudents[0]);
                } else if (highlightedIndex >= 0 && highlightedIndex < filteredStudents.length) {
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
    }, [isDropdownOpen, filteredStudents, highlightedIndex, handleStudentSelect, searchQuery]);

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
            <div className={styles.formSection}>
                <div className={styles.modeToggle}>
                    <div className={styles.switchContainer}>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={isSpendenMode}
                                onChange={(e) => setIsSpendenMode(e.target.checked)}
                                aria-label="Spendenart umschalten"
                            />
                            <span className={styles.switchSlider}></span>
                        </label>
                        <div className={styles.modeLabels}>
                            <span className={`${styles.modeLabel} ${!isSpendenMode ? styles.active : ''}`}>
                                📋 Erhaltene Spenden (Kontoauszug)
                            </span>
                            <span className={`${styles.modeLabel} ${isSpendenMode ? styles.active : ''}`}>
                                📋 Erwartete Spenden (Schülerliste)
                            </span>
                        </div>
                    </div>
                    <p className={styles.modeDescription}>
                        {isSpendenMode
                            ? 'Erfassen Sie erwartete Spenden von Ihren Schülerlisten vor dem Sponsorenlauf'
                            : 'Erfassen Sie die bereits erhaltenen Spenden aus den Kontoauszügen nach dem Sponsorenlauf'}
                    </p>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="donation-form">
                <div className="form-grid">
                    {/* Student Search */}
                    <div className={styles.formGroup}>
                        <label htmlFor="student" className={styles.formLabel}>
                            🔍 Schüler suchen:
                        </label>
                        <div className={styles.studentSearch} ref={dropdownRef}>
                            <input
                                type="text"
                                id="student"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => searchQuery && setIsDropdownOpen(true)}
                                className={`${styles.formControl} ${selectedStudent ? styles.hasSelection : ''}`}
                                placeholder="Name oder Klasse eingeben..."
                                autoComplete="off"
                                ref={searchInputRef}
                                disabled={loading}
                            />

                            {selectedStudent && (
                                <div className={styles.selectedStudent}>
                                    ✅ {selectedStudent.vorname} {selectedStudent.nachname}
                                    <span className={styles.studentClass}>({selectedStudent.klasse})</span>
                                </div>
                            )}

                            {isDropdownOpen && filteredStudents.length > 0 && (
                                <div className={styles.suggestionsDropdown}>
                                    {filteredStudents.map((student, index) => (
                                        <div
                                            key={student.id}
                                            onClick={() => handleStudentSelect(student)}
                                            className={`${styles.suggestionItem} ${highlightedIndex === index ? styles.highlighted : ''}`}
                                            tabIndex={0}
                                            role="option"
                                            aria-selected={highlightedIndex === index}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleStudentSelect(student);
                                                }
                                            }}
                                        >
                                            <div className={styles.studentName}>
                                                {student.vorname} {student.nachname}
                                            </div>
                                            <div className={styles.studentDetails}>
                                                Klasse {student.klasse}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className={styles.formGroup}>
                        <label htmlFor="amount" className={styles.formLabel}>
                            💶 Betrag:
                        </label>
                        <div className={styles.amountInputWrapper}>
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
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && amount && selectedStudent) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                className={`${styles.formControl} ${styles.amountInput}`}
                                placeholder="0,00"
                                ref={amountInputRef}
                                disabled={loading || isSubmitting}
                            />
                            <span className={styles.currencySymbol}>€</span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className={styles.formActions}>
                    <button
                        type="submit"
                        className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
                        disabled={loading || isSubmitting || !selectedStudent || !amount}
                    >
                        {isSubmitting ? (
                            <>
                                <span className={styles.loadingSpinner}></span>
                                Wird gespeichert...
                            </>
                        ) : (
                            <>
                                {isSpendenMode ? ' Erwartete Spende speichern' : '💰 Erhaltene Spende speichern'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Messages */}
            {message && (
                <div className={`${styles.message} ${message.includes('erfolgreich') ? styles.messageSuccess :
                    message.includes('Fehler') ? styles.messageError : styles.messageInfo
                    }`}>
                    {message}
                </div>
            )}

            {/* Student Info */}
            {studentInfo && (
                <div className={styles.studentInfoCard}>
                    <div className={styles.studentHeader}>
                        <h2>📊 Übersicht: {studentInfo.vorname} {studentInfo.nachname}</h2>
                        <span className={styles.studentClassBadge}>{studentInfo.klasse}</span>
                    </div>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>🏃‍♂️ Gelaufene Runden:</span>
                            <span className={styles.infoValue}>{studentInfo.timestamps?.length || 0}</span>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📋 Erwartete Spenden:</span>
                            {(() => {
                                const expectedAmount = studentInfo.spenden ?? 0;
                                return (
                                    <span className={`${styles.infoValue} ${expectedAmount > 0 ? styles.hasValue : ''}`}>
                                        {formatCurrencyDisplay(expectedAmount)}
                                    </span>
                                );
                            })()}
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>💰 Erhaltene Spenden:</span>
                            {(() => {
                                const receivedAmount = studentInfo.spendenKonto?.reduce((a, b) => a + b, 0) ?? 0;
                                return (
                                    <span className={`${styles.infoValue} ${receivedAmount > 0 ? styles.hasValue : ''}`}>
                                        {formatCurrencyDisplay(receivedAmount)}
                                    </span>
                                );
                            })()}
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📈 Differenz:</span>
                            {(() => {
                                const received = studentInfo.spendenKonto?.reduce((a, b) => a + b, 0) ?? 0;
                                const expected = studentInfo.spenden ?? 0;
                                const difference = received - expected;
                                const diffClass = difference === 0 ? 'matched' : 'unmatched';

                                return (
                                    <span className={`${styles.infoValue} ${styles.difference} ${styles[diffClass]}`}>
                                        {difference !== 0 && (difference > 0 ? '+' : '-')}
                                        {formatCurrencyDisplay(Math.abs(difference))}
                                    </span>
                                );
                            })()}
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