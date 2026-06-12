import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import BaseDialog from '../components/BaseDialog';
import styles from '../styles/Donations.module.css';

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatCurrencyDisplay = (value) => {
    const amount = roundMoney(value);
    return `${amount.toFixed(2).replace('.', ',')}€`;
};

const parseCurrencyInput = (amountString) => {
    if (!amountString) return 0;

    const cleaned = String(amountString).replace(/[^\d,.-]/g, '').replace('.', ',');
    const parts = cleaned.split(',');

    if (parts.length === 1) {
        return roundMoney(parseFloat(parts[0] || '0'));
    }

    const euros = parts[0] || '0';
    const cents = (parts[1] || '').padEnd(2, '0').substring(0, 2);
    return roundMoney(parseFloat(`${euros}.${cents}`));
};

const getStudentPaymentState = (student) => {
    const expected = roundMoney(student?.spenden ?? 0);
    const received = roundMoney((student?.spendenKonto || []).reduce((sum, amount) => sum + amount, 0));
    const remaining = roundMoney(expected - received);

    if (expected === 0 && received === 0) {
        return {
            expected,
            received,
            remaining,
            status: 'unset',
            label: 'Noch nicht festgelegt',
            tone: 'neutral'
        };
    }

    if (remaining > 0) {
        return {
            expected,
            received,
            remaining,
            status: 'open',
            label: 'Offen',
            tone: 'warning'
        };
    }

    if (remaining < 0) {
        return {
            expected,
            received,
            remaining,
            status: 'overpaid',
            label: expected === 0 ? 'Zahlung ohne Vorgabe' : 'Zu viel bezahlt',
            tone: 'success'
        };
    }

    return {
        expected,
        received,
        remaining,
        status: 'settled',
        label: 'Bezahlt',
        tone: 'success'
    };
};

const getFilterOptions = (mode) => {
    if (mode === 'expected') {
        return [
            { value: 'all', label: 'Alle' },
            { value: 'unset', label: 'Noch ohne Betrag' },
            { value: 'open', label: 'Noch offen' },
            { value: 'settled', label: 'Schon bezahlt' }
        ];
    }

    return [
        { value: 'open', label: 'Offene Zahlungen' },
        { value: 'settled', label: 'Bezahlt' },
        { value: 'overpaid', label: 'Zu viel bezahlt' },
        { value: 'unset', label: 'Ohne Vorgabe' },
        { value: 'all', label: 'Alle' }
    ];
};

export default function DonationsPage() {
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('expected');
    const [filterStatus, setFilterStatus] = useState('all');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeletion, setPendingDeletion] = useState(null);

    const { request, loading } = useApi();
    const { showError } = useGlobalError();
    const searchInputRef = useRef(null);
    const amountInputRef = useRef(null);
    const deleteDialogRef = useRef(null);

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
        if (!studentId) {
            setSelectedStudentInfo(null);
            return;
        }

        try {
            const data = await request(`/api/students/${studentId}`);
            setSelectedStudentInfo(data);
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
        setAmount('');
        setMessage('');
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

            if (student.payment.status === 'open') stats.openCount += 1;
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

    const filteredStudents = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return studentRows
            .filter((student) => {
                const matchesSearch = !normalizedSearch || [
                    `${student.vorname} ${student.nachname}`,
                    `${student.nachname} ${student.vorname}`,
                    student.klasse,
                    String(student.id)
                ].some((value) => value.toLowerCase().includes(normalizedSearch));

                const matchesFilter = filterStatus === 'all' || student.payment.status === filterStatus;

                return matchesSearch && matchesFilter;
            })
            .sort((left, right) => {
                const statusPriority = {
                    open: 0,
                    unset: 1,
                    overpaid: 2,
                    settled: 3
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
    }, [filterStatus, searchQuery, studentRows]);

    const selectedStudentPayment = selectedStudentInfo
        ? getStudentPaymentState({
            spenden: selectedStudentInfo.spenden,
            spendenKonto: selectedStudentInfo.spendenKonto
        })
        : selectedStudentSummary?.payment || null;

    const handleSelectStudent = useCallback((student) => {
        setSelectedStudentId(student.id);
        setSearchQuery(`${student.vorname} ${student.nachname}`);
        setMessage('');
        setTimeout(() => amountInputRef.current?.focus(), 50);
    }, []);

    const handleAmountChange = useCallback((event) => {
        const value = event.target.value.replace(/[^\d,.-]/g, '').replace('.', ',');
        setAmount(value);
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
            setAmount('');
            setMessage(mode === 'expected'
                ? 'Soll-Betrag erfolgreich gespeichert.'
                : 'Zahlungseingang erfolgreich gespeichert.');
            amountInputRef.current?.focus();
        } catch (error) {
            showError(error, 'Beim Speichern der Spende');
            setMessage('Fehler beim Speichern der Spende.');
        } finally {
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
                <div className={styles.workflowCard}>
                    <div className={styles.workflowStep}>
                        <span className={styles.workflowNumber}>1</span>
                        <div>
                            <strong>Betrag festlegen</strong>
                            <p>Lehrer meldet den Betrag, der überwiesen werden muss.</p>
                        </div>
                    </div>
                    <div className={styles.workflowStep}>
                        <span className={styles.workflowNumber}>2</span>
                        <div>
                            <strong>Zahlung abgleichen</strong>
                            <p>Kontoauszug prüfen und tatsächliche Zahlungseingänge buchen.</p>
                        </div>
                    </div>
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
                            <div className={styles.formGroup}>
                                <label htmlFor="student-search" className={styles.formLabel}>Schüler suchen</label>
                                <input
                                    id="student-search"
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className={styles.formControl}
                                    placeholder="Name, Klasse oder ID"
                                    autoComplete="off"
                                    disabled={loading || isSaving}
                                />
                            </div>

                            <div className={styles.formGroup}>
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
                                        onBlur={() => {
                                            if (amount) {
                                                setAmount(parseCurrencyInput(amount).toFixed(2).replace('.', ','));
                                            }
                                        }}
                                        className={`${styles.formControl} ${styles.amountInput}`}
                                        placeholder="0,00"
                                        disabled={loading || isSaving}
                                    />
                                    <span className={styles.currencySymbol}>€</span>
                                </div>
                            </div>

                            {selectedStudentSummary && (
                                <div className={styles.selectionBox}>
                                    <div>
                                        <strong>{selectedStudentSummary.vorname} {selectedStudentSummary.nachname}</strong>
                                        <div className={styles.selectionMeta}>
                                            Klasse {selectedStudentSummary.klasse} · ID {selectedStudentSummary.id}
                                        </div>
                                    </div>
                                    <span className={`${styles.statusBadge} ${styles[`status${selectedStudentSummary.payment.tone}`]}`}>
                                        {selectedStudentSummary.payment.label}
                                    </span>
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

                            <div className={styles.formActions}>
                                <button
                                    type="submit"
                                    className={styles.primaryAction}
                                    disabled={loading || isSaving || !selectedStudentId || !amount}
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

                    {selectedStudentInfo && selectedStudentPayment && (
                        <section className={styles.panel}>
                            <div className={styles.detailHeader}>
                                <div>
                                    <h2>{selectedStudentInfo.vorname} {selectedStudentInfo.nachname}</h2>
                                    <p>Klasse {selectedStudentInfo.klasse} · {selectedStudentInfo.timestamps?.length || 0} gelaufene Runden</p>
                                </div>
                                <span className={`${styles.statusBadge} ${styles[`status${selectedStudentPayment.tone}`]}`}>
                                    {selectedStudentPayment.label}
                                </span>
                            </div>

                            <div className={styles.detailStats}>
                                <div className={styles.detailStatCard}>
                                    <span>Zu zahlen</span>
                                    <strong>{formatCurrencyDisplay(selectedStudentPayment.expected)}</strong>
                                </div>
                                <div className={styles.detailStatCard}>
                                    <span>Ist</span>
                                    <strong>{formatCurrencyDisplay(selectedStudentPayment.received)}</strong>
                                </div>
                                <div className={styles.detailStatCard}>
                                    <span>Offen</span>
                                    <strong>{formatCurrencyDisplay(Math.max(selectedStudentPayment.remaining, 0))}</strong>
                                </div>
                                <div className={styles.detailStatCard}>
                                    <span>Abweichung</span>
                                    <strong>{formatCurrencyDisplay(Math.abs(selectedStudentPayment.remaining))}</strong>
                                </div>
                            </div>

                            <div className={styles.historyGrid}>
                                <div className={styles.historySection}>
                                    <h3>Festgelegte Beträge</h3>
                                    {selectedStudentInfo.expectedDonations?.length ? (
                                        <div className={styles.historyList}>
                                            {selectedStudentInfo.expectedDonations.map((donation) => (
                                                <div key={donation.id} className={styles.historyItem}>
                                                    <div>
                                                        <strong>{formatCurrencyDisplay(donation.amount)}</strong>
                                                        <div className={styles.historyMeta}>
                                                            {new Date(donation.created_at).toLocaleString('de-DE')}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={styles.deleteButton}
                                                        onClick={() => confirmDeleteDonation(donation, 'expected')}
                                                    >
                                                        Löschen
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.emptyState}>Noch kein Betrag festgelegt.</p>
                                    )}
                                </div>

                                <div className={styles.historySection}>
                                    <h3>Zahlungseingänge</h3>
                                    {selectedStudentInfo.receivedDonations?.length ? (
                                        <div className={styles.historyList}>
                                            {selectedStudentInfo.receivedDonations.map((donation) => (
                                                <div key={donation.id} className={styles.historyItem}>
                                                    <div>
                                                        <strong>{formatCurrencyDisplay(donation.amount)}</strong>
                                                        <div className={styles.historyMeta}>
                                                            {new Date(donation.created_at).toLocaleString('de-DE')}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={styles.deleteButton}
                                                        onClick={() => confirmDeleteDonation(donation, 'received')}
                                                    >
                                                        Löschen
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.emptyState}>Noch keine Zahlungseingänge verbucht.</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <aside className={styles.sideColumn}>
                    <section className={styles.panel}>
                        <div className={styles.sideHeader}>
                            <h2>{mode === 'expected' ? 'Betragsliste' : 'Abgleichsliste'}</h2>
                            <span>{filteredStudents.length} Treffer</span>
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
