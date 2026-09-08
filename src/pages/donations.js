import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import BaseDialog from '../components/BaseDialog';
import styles from '../styles/Donations.module.css';
import {
    findStudentSuggestions,
    formatCurrencyDisplay,
    getStudentPaymentState,
    parseCurrencyInput,
    shiftCurrencyInput
} from '../utils/donationWorkflow';

const getFilterOptions = (mode) => {
    if (mode === 'expected') {
        return [
            { value: 'all', label: 'Alle' },
            { value: 'unset', label: 'Noch ohne Betrag' },
            { value: 'entered', label: 'Betrag erfasst' }
        ];
    }

    return [
        { value: 'open', label: 'Offene Zahlungen' },
        { value: 'partial', label: 'Teilweise bezahlt' },
        { value: 'settled', label: 'Bezahlt' },
        { value: 'overpaid', label: 'Überzahlt' },
        { value: 'unexpected', label: 'Zahlung ohne Soll' },
        { value: 'unset', label: 'Noch nicht erfasst' },
        { value: 'all', label: 'Alle' }
    ];
};

export default function DonationsPage() {
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [amount, setAmount] = useState('0,00');
    const [mode, setMode] = useState('expected');
    const [filterStatus, setFilterStatus] = useState('all');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeletion, setPendingDeletion] = useState(null);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [classFilter, setClassFilter] = useState('all');

    const { request, loading } = useApi();
    const { showError } = useGlobalError();
    const searchInputRef = useRef(null);
    const amountInputRef = useRef(null);
    const deleteDialogRef = useRef(null);
    const savingRef = useRef(false);
    const studentInfoRequestRef = useRef(0);

    const loadStudents = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.STUDENTS);
            setStudents(data);
        } catch (error) {
            showError(error, 'Beim Laden der Spendenübersicht');
            setMessage('Fehler beim Laden der Spendenübersicht.');
        }
    }, [request, showError]);

    const loadStudentInfo = useCallback(async (studentId) => {
        const requestId = ++studentInfoRequestRef.current;
        if (!studentId) {
            setSelectedStudentInfo(null);
            return;
        }

        try {
            const data = await request(`${API_ENDPOINTS.DONATIONS}?studentId=${studentId}`);
            if (requestId === studentInfoRequestRef.current) setSelectedStudentInfo(data);
        } catch (error) {
            showError(error, 'Beim Laden der Schülerdetails');
        }
    }, [request, showError]);

    useEffect(() => {
        loadStudents();
        searchInputRef.current?.focus();
    }, [loadStudents]);

    useEffect(() => {
        loadStudentInfo(selectedStudentId);
    }, [selectedStudentId, loadStudentInfo]);

    useEffect(() => {
        setFilterStatus(mode === 'received' ? 'open' : 'all');
        setAmount('0,00');
        setMessage('');
        setSelectedStudentId(null);
        setSelectedStudentInfo(null);
        setSearchQuery('');
        setShowSuggestions(false);
        setTimeout(() => searchInputRef.current?.focus(), 0);
    }, [mode]);

    const studentRows = useMemo(() => {
        return students.map((student) => ({
            ...student,
            payment: getStudentPaymentState(student)
        }));
    }, [students]);

    const selectedStudentSummary = useMemo(() => {
        return studentRows.find((student) => student.id === selectedStudentId) || null;
    }, [studentRows, selectedStudentId]);

    const dashboardStats = useMemo(() => {
        return studentRows.reduce((stats, student) => {
            stats.totalExpected += student.payment.expected;
            stats.totalReceived += student.payment.received;

            if (['open', 'partial'].includes(student.payment.status)) stats.openCount += 1;
            if (student.payment.status === 'settled') stats.settledCount += 1;
            if (student.payment.status === 'overpaid') stats.overpaidCount += 1;
            if (student.payment.status === 'unset') stats.unsetCount += 1;

            return stats;
        }, {
            totalExpected: 0,
            totalReceived: 0,
            openCount: 0,
            settledCount: 0,
            overpaidCount: 0,
            unsetCount: 0
        });
    }, [studentRows]);

    const classOptions = useMemo(() => [...new Set(studentRows.map((student) => student.klasse).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, 'de')), [studentRows]);

    const suggestions = useMemo(
        () => findStudentSuggestions(studentRows, searchQuery),
        [searchQuery, studentRows]
    );

    const filteredStudents = useMemo(() => {
        return studentRows
            .filter((student) => {
                const matchesClass = classFilter === 'all' || student.klasse === classFilter;
                const matchesFilter = filterStatus === 'all'
                    || (filterStatus === 'entered' ? student.payment.expected > 0 : student.payment.status === filterStatus);
                return matchesClass && matchesFilter;
            })
            .sort((left, right) => {
                const statusPriority = {
                    partial: 0,
                    open: 1,
                    unexpected: 2,
                    unset: 3,
                    overpaid: 4,
                    settled: 5
                };

                const statusDiff = (statusPriority[left.payment.status] ?? 99) - (statusPriority[right.payment.status] ?? 99);
                if (statusDiff !== 0) return statusDiff;

                if (left.payment.remaining !== right.payment.remaining) {
                    return right.payment.remaining - left.payment.remaining;
                }

                if (left.klasse !== right.klasse) {
                    return left.klasse.localeCompare(right.klasse, 'de');
                }

                return `${left.nachname} ${left.vorname}`.localeCompare(`${right.nachname} ${right.vorname}`, 'de');
            });
    }, [classFilter, filterStatus, studentRows]);

    const selectedStudentPayment = selectedStudentInfo
        ? getStudentPaymentState({
            spenden: selectedStudentInfo.spenden,
            spendenKonto: selectedStudentInfo.spendenKonto
        })
        : selectedStudentSummary?.payment || null;

    const handleSelectStudent = useCallback((student) => {
        setSelectedStudentId(student.id);
        setSearchQuery(`${student.vorname} ${student.nachname}`);
        setShowSuggestions(false);
        const payment = getStudentPaymentState(student);
        const suggestedAmount = mode === 'received' && payment.remaining > 0
            ? payment.remaining
            : mode === 'expected' && payment.expected > 0 ? payment.expected : null;
        setAmount(suggestedAmount ? suggestedAmount.toFixed(2).replace('.', ',') : '0,00');
        setMessage('');
        setTimeout(() => {
            amountInputRef.current?.focus();
            amountInputRef.current?.select();
        }, 50);
    }, [mode]);

    const handleSearchChange = useCallback((event) => {
        setSearchQuery(event.target.value);
        setSelectedStudentId(null);
        setSelectedStudentInfo(null);
        setAmount('0,00');
        setSuggestionIndex(0);
        setShowSuggestions(Boolean(event.target.value.trim()));
    }, []);

    const handleSearchKeyDown = useCallback((event) => {
        if (event.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedStudentId(null);
            return;
        }
        if (!showSuggestions || suggestions.length === 0) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            setSuggestionIndex((current) => (current + direction + suggestions.length) % suggestions.length);
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSelectStudent(suggestions[suggestionIndex] || suggestions[0]);
        }
    }, [handleSelectStudent, showSuggestions, suggestionIndex, suggestions]);

    const handleAmountKeyDown = useCallback((event) => {
        if (!/^\d$/.test(event.key) && !['Backspace', 'Delete'].includes(event.key)) return;
        event.preventDefault();
        const replace = event.currentTarget.selectionStart === 0
            && event.currentTarget.selectionEnd === event.currentTarget.value.length;
        setAmount((current) => shiftCurrencyInput(current, event.key, replace));
    }, []);

    const handleAmountPaste = useCallback((event) => {
        event.preventDefault();
        const pasted = event.clipboardData.getData('text').trim();
        if (!pasted) return;
        if (/[,.]/.test(pasted)) {
            setAmount(parseCurrencyInput(pasted).toFixed(2).replace('.', ','));
            return;
        }
        const digits = pasted.replace(/\D/g, '');
        setAmount(digits ? shiftCurrencyInput('0,00', digits[0], true) : '0,00');
        if (digits.length > 1) {
            setAmount(digits.split('').reduce((value, digit) => shiftCurrencyInput(value, digit), '0,00'));
        }
    }, []);

    const handleAmountChange = useCallback((event) => {
        const inputType = event.nativeEvent?.inputType || '';
        const insertedDigits = String(event.nativeEvent?.data || '').replace(/\D/g, '');
        if (insertedDigits) {
            setAmount((current) => insertedDigits.split('').reduce(
                (value, digit) => shiftCurrencyInput(value, digit),
                current
            ));
        } else if (inputType.includes('delete')) {
            setAmount((current) => shiftCurrencyInput(current, 'Backspace'));
        }
    }, []);

    const handleQuickFillRemaining = useCallback(() => {
        if (!selectedStudentPayment || selectedStudentPayment.remaining <= 0) return;
        setAmount(selectedStudentPayment.remaining.toFixed(2).replace('.', ','));
        amountInputRef.current?.focus();
    }, [selectedStudentPayment]);

    const refreshData = useCallback(async () => {
        await loadStudents();
        await loadStudentInfo(selectedStudentId);
    }, [loadStudentInfo, loadStudents, selectedStudentId]);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();

        if (savingRef.current) return;

        if (!selectedStudentId) {
            setMessage('Bitte zuerst einen Schüler auswählen.');
            searchInputRef.current?.focus();
            return;
        }

        const parsedAmount = parseCurrencyInput(amount);
        if (parsedAmount <= 0) {
            setMessage('Bitte einen gültigen Betrag eingeben.');
            amountInputRef.current?.focus();
            return;
        }

        savingRef.current = true;
        setIsSaving(true);
        setMessage('');

        try {
            await request(API_ENDPOINTS.DONATIONS, {
                method: 'POST',
                data: {
                    studentId: selectedStudentId,
                    amount: formatCurrencyDisplay(parsedAmount),
                    mode
                }
            });

            await refreshData();
            setAmount('0,00');
            setMessage(mode === 'expected'
                ? 'Soll-Betrag erfolgreich gespeichert.'
                : 'Zahlungseingang erfolgreich gespeichert.');
            setSelectedStudentId(null);
            setSelectedStudentInfo(null);
            setSearchQuery('');
            setTimeout(() => searchInputRef.current?.focus(), 50);
        } catch (error) {
            showError(error, 'Beim Speichern der Spende');
            setMessage('Fehler beim Speichern der Spende.');
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }, [amount, mode, refreshData, request, selectedStudentId, showError]);

    const confirmDeleteDonation = useCallback((donation, type) => {
        setPendingDeletion({ donation, type });
        deleteDialogRef.current?.showModal();
    }, []);

    const handleDeleteDonation = useCallback(async () => {
        if (!selectedStudentInfo || !pendingDeletion) return;

        try {
            await request(API_ENDPOINTS.DONATIONS, {
                method: 'DELETE',
                data: { donationId: pendingDeletion.donation.id, type: pendingDeletion.type }
            });

            await refreshData();
            setMessage('Eintrag erfolgreich gelöscht.');
            setPendingDeletion(null);
            deleteDialogRef.current?.close();
        } catch (error) {
            showError(error, 'Beim Löschen des Spenden-Eintrags');
            setMessage('Fehler beim Löschen des Eintrags.');
        }
    }, [pendingDeletion, refreshData, request, selectedStudentInfo, showError]);

    return (
        <div className="page-container-wide">
            <div className={styles.pageIntro}>
                <div>
                    <h1 className="page-title">Spendenabgleich</h1>
                    <p className={styles.subtitle}>
                        Erst den fälligen Betrag pro Schülerin oder Schüler erfassen, danach die realen Zahlungseingänge aus dem Kontoauszug verbuchen.
                    </p>
                </div>
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Zu zahlen gesamt</span>
                    <strong>{formatCurrencyDisplay(dashboardStats.totalExpected)}</strong>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Ist gesamt</span>
                    <strong>{formatCurrencyDisplay(dashboardStats.totalReceived)}</strong>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Noch offen</span>
                    <strong>{dashboardStats.openCount}</strong>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Bezahlt</span>
                    <strong>{dashboardStats.settledCount}</strong>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Ohne Betrag</span>
                    <strong>{dashboardStats.unsetCount}</strong>
                </div>
            </div>

            <div className={styles.layoutGrid}>
                <div className={styles.primaryColumn}>
                    <section className={styles.panel}>
                        <div className={styles.modeTabs}>
                            <button
                                type="button"
                                className={`${styles.modeTab} ${mode === 'expected' ? styles.modeTabActive : ''}`}
                                onClick={() => setMode('expected')}
                                aria-pressed={mode === 'expected'}
                            >
                                Fälligen Betrag erfassen
                            </button>
                            <button
                                type="button"
                                className={`${styles.modeTab} ${mode === 'received' ? styles.modeTabActive : ''}`}
                                onClick={() => setMode('received')}
                                aria-pressed={mode === 'received'}
                            >
                                Zahlungseingang buchen
                            </button>
                        </div>

                        <p className={styles.panelHint}>
                            {mode === 'expected'
                                ? 'Setzt den Betrag, den der Schüler laut Lehrer überweisen muss.'
                                : 'Erfasst eine eingegangene Zahlung aus dem Kontoauszug. Mehrere Teilzahlungen bleiben möglich.'}
                        </p>

                        <form onSubmit={handleSubmit} className={styles.editorForm}>
                            <div className={`${styles.formGroup} ${styles.searchGroup}`}>
                                <label htmlFor="student-search" className={styles.formLabel}>Schüler suchen</label>
                                <input
                                    id="student-search"
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onKeyDown={handleSearchKeyDown}
                                    onFocus={() => setShowSuggestions(Boolean(searchQuery.trim()) && !selectedStudentId)}
                                    className={styles.formControl}
                                    placeholder="Name, Klasse oder ID"
                                    autoComplete="off"
                                    role="combobox"
                                    aria-autocomplete="list"
                                    aria-expanded={showSuggestions && suggestions.length > 0}
                                    aria-controls="student-suggestions"
                                    aria-activedescendant={showSuggestions && suggestions.length ? `student-suggestion-${suggestions[suggestionIndex]?.id}` : undefined}
                                    disabled={loading || isSaving}
                                />
                                {showSuggestions && (
                                    <div id="student-suggestions" className={styles.suggestions} role="listbox">
                                        {suggestions.length ? suggestions.map((student, index) => (
                                            <button
                                                id={`student-suggestion-${student.id}`}
                                                key={student.id}
                                                type="button"
                                                role="option"
                                                aria-selected={index === suggestionIndex}
                                                className={`${styles.suggestion} ${index === suggestionIndex ? styles.suggestionActive : ''}`}
                                                onMouseDown={(event) => event.preventDefault()}
                                                onClick={() => handleSelectStudent(student)}
                                            >
                                                <span><strong>{student.vorname} {student.nachname}</strong><small>Klasse {student.klasse} · ID {student.id}</small></span>
                                                <span className={`${styles.statusBadge} ${styles[`status${student.payment.tone}`]}`}>{student.payment.label}</span>
                                            </button>
                                        )) : <p className={styles.noSuggestions}>Keine Schüler gefunden.</p>}
                                    </div>
                                )}
                            </div>

                            <div className={`${styles.formGroup} ${styles.amountGroup}`}>
                                <label htmlFor="donation-amount" className={styles.formLabel}>
                                    {mode === 'expected' ? 'Fälliger Betrag' : 'Zahlungseingang'}
                                </label>
                                <div className={styles.amountInputWrapper}>
                                    <input
                                        id="donation-amount"
                                        ref={amountInputRef}
                                        type="text"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        onKeyDown={handleAmountKeyDown}
                                        onPaste={handleAmountPaste}
                                        inputMode="numeric"
                                        className={`${styles.formControl} ${styles.amountInput}`}
                                        aria-label={mode === 'expected' ? 'Fälliger Betrag in Euro' : 'Zahlungseingang in Euro'}
                                        disabled={loading || isSaving}
                                    />
                                    <span className={styles.currencySymbol}>€</span>
                                </div>
                            </div>

                            {selectedStudentSummary && (
                                <div className={styles.accountPreview}>
                                    <div className={styles.previewHeader}>
                                        <div><strong>{selectedStudentSummary.vorname} {selectedStudentSummary.nachname}</strong><span>Klasse {selectedStudentSummary.klasse} · ID {selectedStudentSummary.id}</span></div>
                                        <span className={`${styles.statusBadge} ${styles[`status${selectedStudentSummary.payment.tone}`]}`}>{selectedStudentSummary.payment.label}</span>
                                    </div>
                                    <div className={styles.previewAmounts}>
                                        <span>Soll <strong>{formatCurrencyDisplay(selectedStudentSummary.payment.expected)}</strong></span>
                                        <span>Bezahlt <strong>{formatCurrencyDisplay(selectedStudentSummary.payment.received)}</strong></span>
                                        <span>{selectedStudentSummary.payment.remaining < 0 ? 'Überzahlt' : 'Offen'} <strong>{formatCurrencyDisplay(Math.abs(selectedStudentSummary.payment.remaining))}</strong></span>
                                    </div>
                                    {selectedStudentInfo && (selectedStudentInfo.expectedDonations?.length > 0 || selectedStudentInfo.receivedDonations?.length > 0) && (
                                        <div className={styles.entryOverview} aria-label="Gespeicherte Spendeneinträge">
                                            <div className={styles.entryGroup}>
                                                <strong className={styles.entryHeading}>Sollbetrag</strong>
                                                {selectedStudentInfo.expectedDonations?.length ? selectedStudentInfo.expectedDonations.map((donation) => (
                                                    <div key={`expected-${donation.id}`} className={styles.entryRow}>
                                                        <span>{formatCurrencyDisplay(donation.amount)}</span>
                                                        <span>{new Date(donation.created_at).toLocaleDateString('de-DE')}</span>
                                                        <button type="button" onClick={() => confirmDeleteDonation(donation, 'expected')}>Löschen</button>
                                                    </div>
                                                )) : <span className={styles.entryEmpty}>Nicht erfasst</span>}
                                            </div>
                                            <div className={styles.entryGroup}>
                                                <strong className={styles.entryHeading}>Zahlungseingänge</strong>
                                                {selectedStudentInfo.receivedDonations?.length ? selectedStudentInfo.receivedDonations.map((donation) => (
                                                    <div key={donation.id} className={styles.entryRow}>
                                                        <span>{formatCurrencyDisplay(donation.amount)}</span>
                                                        <span>{new Date(donation.created_at).toLocaleDateString('de-DE')}</span>
                                                        <button type="button" onClick={() => confirmDeleteDonation(donation, 'received')}>Löschen</button>
                                                    </div>
                                                )) : <span className={styles.entryEmpty}>Keine Zahlungen</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'received' && selectedStudentPayment?.remaining > 0 && (
                                <button
                                    type="button"
                                    className={styles.secondaryAction}
                                    onClick={handleQuickFillRemaining}
                                >
                                    Restbetrag übernehmen ({formatCurrencyDisplay(selectedStudentPayment.remaining)})
                                </button>
                            )}

                            {mode === 'received' && amount && selectedStudentPayment && parseCurrencyInput(amount) > selectedStudentPayment.remaining && selectedStudentPayment.expected > 0 && (
                                <div className={styles.overpaymentWarning} role="alert">
                                    Dieser Eintrag führt zu einer Überzahlung von {formatCurrencyDisplay(parseCurrencyInput(amount) - selectedStudentPayment.remaining)}.
                                </div>
                            )}

                            <div className={styles.formActions}>
                                <button
                                    type="submit"
                                    className={styles.primaryAction}
                                    disabled={loading || isSaving || !selectedStudentId || parseCurrencyInput(amount) <= 0}
                                >
                                    {isSaving
                                        ? 'Wird gespeichert...'
                                        : mode === 'expected'
                                            ? 'Betrag speichern'
                                            : 'Zahlungseingang speichern'}
                                </button>
                            </div>
                        </form>

                        {message && (
                            <div
                                className={`${styles.message} ${message.includes('Fehler') ? styles.messageError : styles.messageSuccess}`}
                                role={message.includes('Fehler') ? 'alert' : 'status'}
                                aria-live={message.includes('Fehler') ? 'assertive' : 'polite'}
                            >
                                {message}
                            </div>
                        )}
                    </section>

                </div>

                <aside className={styles.sideColumn}>
                    <section className={styles.panel}>
                        <div className={styles.sideHeader}>
                            <div>
                                <h2>{mode === 'expected' ? 'Betragsliste' : 'Abgleichsliste'}</h2>
                                <span>{mode === 'expected'
                                    ? `${studentRows.filter((student) => student.payment.expected > 0).length} von ${studentRows.length} erfasst`
                                    : `${dashboardStats.settledCount} von ${studentRows.length} bezahlt`}</span>
                            </div>
                            <select
                                className={styles.classFilter}
                                value={classFilter}
                                onChange={(event) => setClassFilter(event.target.value)}
                                aria-label="Nach Klasse filtern"
                            >
                                <option value="all">Alle Klassen</option>
                                {classOptions.map((className) => <option key={className} value={className}>{className}</option>)}
                            </select>
                        </div>

                        <div className={styles.filterChips}>
                            {getFilterOptions(mode).map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`${styles.filterChip} ${filterStatus === option.value ? styles.filterChipActive : ''}`}
                                    onClick={() => setFilterStatus(option.value)}
                                    aria-pressed={filterStatus === option.value}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <div className={styles.studentQueue}>
                            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                <button
                                    key={student.id}
                                    type="button"
                                    className={`${styles.queueItem} ${selectedStudentId === student.id ? styles.queueItemActive : ''}`}
                                    onClick={() => handleSelectStudent(student)}
                                >
                                    <div className={styles.queueMain}>
                                        <div>
                                            <strong>{student.vorname} {student.nachname}</strong>
                                            <div className={styles.queueMeta}>
                                                Klasse {student.klasse} · ID {student.id}
                                            </div>
                                        </div>
                                        <span className={`${styles.statusBadge} ${styles[`status${student.payment.tone}`]}`}>
                                            {student.payment.label}
                                        </span>
                                    </div>
                                    <div className={styles.queueAmounts}>
                                        <span>Zu zahlen {formatCurrencyDisplay(student.payment.expected)}</span>
                                        <span>Ist {formatCurrencyDisplay(student.payment.received)}</span>
                                        <span>
                                            {student.payment.remaining > 0 ? 'Offen' : 'Abweichung'} {formatCurrencyDisplay(Math.abs(student.payment.remaining))}
                                        </span>
                                    </div>
                                </button>
                            )) : (
                                <p className={styles.emptyState}>Keine Schüler für den aktuellen Filter gefunden.</p>
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            <BaseDialog
                dialogRef={deleteDialogRef}
                title="Spenden-Eintrag löschen"
                onClose={() => setPendingDeletion(null)}
                showDefaultClose={false}
                actions={[
                    {
                        label: 'Abbrechen',
                        position: 'left',
                        onClick: () => deleteDialogRef.current?.close(),
                    },
                    {
                        label: 'Eintrag löschen',
                        variant: 'danger',
                        onClick: handleDeleteDonation,
                        disabled: !pendingDeletion,
                    },
                ]}
            >
                {pendingDeletion ? (
                    <div>
                        <p>Möchten Sie diesen Eintrag wirklich löschen?</p>
                        <p>
                            <strong>Schüler:</strong> {selectedStudentInfo?.vorname} {selectedStudentInfo?.nachname}
                        </p>
                        <p>
                            <strong>Typ:</strong> {pendingDeletion.type === 'expected' ? 'Festgelegter Betrag' : 'Zahlungseingang'}
                        </p>
                        <p>
                            <strong>Betrag:</strong> {formatCurrencyDisplay(pendingDeletion.donation.amount)}
                        </p>
                    </div>
                ) : null}
            </BaseDialog>
        </div>
    );
}
