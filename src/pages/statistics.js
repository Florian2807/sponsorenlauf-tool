import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency, API_ENDPOINTS, downloadFile } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useDonationDisplayMode } from '../contexts/DonationDisplayModeContext';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import StatisticsWidget from '../components/statistics/StatisticsWidget';
import StatisticsTable from '../components/statistics/StatisticsTable';
import AdvancedExportDialog from '../components/dialogs/statistics/AdvancedExportDialog';

const GENDER_LABELS = {
    weiblich: 'Weiblich',
    männlich: 'Männlich',
    divers: 'Divers',
    unbekannt: 'Unbekannt',
};

const GENDER_ICONS = {
    weiblich: '🟣',
    männlich: '🔵',
    divers: '🟢',
    unbekannt: '⚪',
};

export default function Statistics() {
    const [stats, setStats] = useState({
        classStats: [],
        topStudentsByRounds: [],
        topStudentsByMoney: [],
        topStudentsByRoundsByGender: {},
        topStudentsByMoneyByGender: {},
        topClassesOfGrades: {},
        averageRounds: 0,
        totalRounds: 0,
        totalStudents: 0,
        activeStudents: 0,
        totalDonations: 0,
        rawStudents: [],
        genderBreakdown: [],
        activityDistributionByGender: {},
    });
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [selectedGenderFilter, setSelectedGenderFilter] = useState('all');

    const { request, loading, error } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { mode: donationMode } = useDonationDisplayMode();
    const { isDonationsEnabled } = useModuleConfig();

    const participationRate = useMemo(() => {
        if (!stats.totalStudents) return 0;
        return (stats.activeStudents / stats.totalStudents) * 100;
    }, [stats.activeStudents, stats.totalStudents]);

    const topClass = stats.classStats?.[0] || null;
    const topRoundStudent = stats.topStudentsByRounds?.[0] || null;
    const topDonationStudent = stats.topStudentsByMoney?.[0] || null;
    const inactiveStudents = Math.max(stats.totalStudents - stats.activeStudents, 0);
    const highPerformerCount = stats.activityDistribution?.highPerformers || 0;
    const genderFilterOptions = useMemo(
        () => [{ value: 'all', label: 'Alle', icon: '🌍' }, ...(stats.genderBreakdown || []).map((item) => ({
            value: item.gender,
            label: GENDER_LABELS[item.gender] || item.gender,
            icon: GENDER_ICONS[item.gender] || '•',
        }))],
        [stats.genderBreakdown]
    );

    const filteredRawStudents = useMemo(() => {
        if (selectedGenderFilter === 'all') {
            return stats.rawStudents || [];
        }

        return (stats.rawStudents || []).filter((student) => student.geschlechtNormalized === selectedGenderFilter);
    }, [selectedGenderFilter, stats.rawStudents]);

    const filteredTopStudentsByRounds = useMemo(() => {
        if (selectedGenderFilter === 'all') {
            return stats.topStudentsByRounds || [];
        }

        return stats.topStudentsByRoundsByGender?.[selectedGenderFilter] || [];
    }, [selectedGenderFilter, stats.topStudentsByRounds, stats.topStudentsByRoundsByGender]);

    const filteredTopStudentsByMoney = useMemo(() => {
        if (selectedGenderFilter === 'all') {
            return stats.topStudentsByMoney || [];
        }

        return stats.topStudentsByMoneyByGender?.[selectedGenderFilter] || [];
    }, [selectedGenderFilter, stats.topStudentsByMoney, stats.topStudentsByMoneyByGender]);

    const selectedGenderBreakdown = useMemo(() => {
        if (selectedGenderFilter === 'all') {
            return null;
        }

        return (stats.genderBreakdown || []).find((item) => item.gender === selectedGenderFilter) || null;
    }, [selectedGenderFilter, stats.genderBreakdown]);

    const needsAttentionClasses = useMemo(() => {
        return (stats.classStats || [])
            .filter((item) => item.totalStudents >= 3 && item.participationRate < 50)
            .slice(0, 3);
    }, [stats.classStats]);

    const dashboardHighlights = useMemo(() => {
        const items = [];

        if (topClass) {
            items.push({
                tone: 'primary',
                title: `Klasse ${topClass.klasse} führt aktuell`,
                text: `${topClass.totalRounds} Runden gesamt bei ${topClass.participationRate.toFixed(1)}% Teilnahme.`,
            });
        }

        if (inactiveStudents > 0) {
            items.push({
                tone: 'warning',
                title: `${inactiveStudents} Schüler noch ohne Runde`,
                text: 'Hier lohnt sich ein Blick auf Teilnahme oder Nacherfassung.',
            });
        }

        if (highPerformerCount > 0) {
            items.push({
                tone: 'success',
                title: `${highPerformerCount} starke Leistungen`,
                text: 'So viele Schüler haben bereits 10 oder mehr Runden erreicht.',
            });
        }

        if (needsAttentionClasses.length > 0) {
            items.push({
                tone: 'danger',
                title: 'Klassen mit niedriger Teilnahme',
                text: needsAttentionClasses.map((item) => `${item.klasse} (${item.participationRate.toFixed(0)}%)`).join(', '),
            });
        }

        if (isDonationsEnabled && topDonationStudent) {
            items.push({
                tone: 'success',
                title: `${topDonationStudent.vorname} ${topDonationStudent.nachname} führt bei Spenden`,
                text: `${formatCurrency(topDonationStudent.spenden)} im aktuellen ${donationMode === 'expected' ? 'Erwartungs-' : 'Zahlungs'}modus.`,
            });
        }

        return items.slice(0, 4);
    }, [donationMode, highPerformerCount, inactiveStudents, isDonationsEnabled, needsAttentionClasses, topClass, topDonationStudent]);

    const overviewWidgets = useMemo(() => {
        return [
            {
                title: 'Gesamte Runden',
                value: stats.totalRounds,
                icon: '🔄',
                color: 'primary',
                format: 'number',
                subvalue: `${stats.activeStudents} aktive Schüler`,
                footer: topClass ? `Stärkste Klasse: ${topClass.klasse}` : 'Noch keine Klassenspitze verfügbar',
            },
            {
                title: 'Teilnahme',
                value: participationRate,
                icon: '👥',
                color: 'success',
                format: 'percentage',
                subvalue: `${stats.activeStudents} von ${stats.totalStudents} Schülern aktiv`,
                footer: inactiveStudents > 0 ? `${inactiveStudents} Schüler noch ohne Runde` : 'Alle Schüler haben bereits Runden',
            },
            {
                title: 'Ø Runden pro aktivem Schüler',
                value: stats.averageRounds,
                icon: '📊',
                color: 'warning',
                format: 'decimal',
                subvalue: `${highPerformerCount} Schüler mit 10+ Runden`,
                footer: topRoundStudent ? `Top-Wert: ${topRoundStudent.vorname} ${topRoundStudent.nachname} mit ${topRoundStudent.rounds}` : 'Noch keine Rundenspitze verfügbar',
            },
            ...(isDonationsEnabled ? [
                {
                    title: `Gesamte ${donationMode === 'expected' ? 'Erwartete' : 'Erhaltene'} Spenden`,
                    value: stats.totalDonations,
                    icon: '💰',
                    color: 'success',
                    format: 'currency',
                    subvalue: topDonationStudent ? `Spitzenwert: ${formatCurrency(topDonationStudent.spenden)}` : 'Noch keine Spendenwerte vorhanden',
                    footer: topDonationStudent ? `${topDonationStudent.vorname} ${topDonationStudent.nachname} aus ${topDonationStudent.klasse}` : 'Die Spendenanalyse aktualisiert sich mit dem aktiven Modus',
                    badge: donationMode === 'expected' ? 'Soll' : 'Ist',
                },
            ] : []),
        ];
    }, [donationMode, highPerformerCount, inactiveStudents, isDonationsEnabled, participationRate, stats.activeStudents, stats.averageRounds, stats.totalDonations, stats.totalRounds, stats.totalStudents, topClass, topDonationStudent, topRoundStudent]);

    const classComparisonCards = useMemo(() => {
        return (stats.classStats || []).slice(0, 6);
    }, [stats.classStats]);

    const genderOverviewCards = useMemo(() => {
        return (stats.genderBreakdown || []).map((item) => ({
            ...item,
            label: GENDER_LABELS[item.gender] || item.gender,
            icon: GENDER_ICONS[item.gender] || '•',
        }));
    }, [stats.genderBreakdown]);

    const genderInsights = useMemo(() => {
        return genderOverviewCards.map((item) => ({
            key: item.gender,
            title: `${item.icon} ${item.label}`,
            text: `${item.activeCount} von ${item.count} Schülern aktiv (${item.participationRate.toFixed(1)}%). Ø ${item.averageRoundsActive.toFixed(2)} Runden pro aktivem Schüler.`,
            footer: item.topRoundStudent
                ? `Top-Leistung: ${item.topRoundStudent.vorname} ${item.topRoundStudent.nachname} mit ${item.topRoundStudent.rounds} Runden`
                : 'Noch keine aktiven Läufer in dieser Gruppe',
        }));
    }, [genderOverviewCards]);

    const genderActivityCards = useMemo(() => {
        return genderOverviewCards.map((item) => ({
            ...item,
            distribution: stats.activityDistributionByGender?.[item.gender] || {},
        }));
    }, [genderOverviewCards, stats.activityDistributionByGender]);

    const gradeLeaders = useMemo(() => {
        return Object.entries(stats.topClassesOfGrades || {})
            .map(([grade, classes]) => ({
                grade,
                leader: classes?.[0] || null,
            }))
            .filter((item) => item.leader);
    }, [stats.topClassesOfGrades]);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const data = await request(API_ENDPOINTS.STATISTICS);
                setStats(data);
            } catch (error) {
                showError(error, 'Beim Abrufen der Statistiken');
            }
        };
        fetchStatistics();
    }, [request, showError, donationMode]); // Daten neu laden wenn sich der Modus ändert

    const handleExport = useCallback(async (exportData) => {
        try {
            if (exportData.format === 'html') {
                // Für HTML-Export die bestehende Route verwenden
                const response = await request(API_ENDPOINTS.EXPORT_STATISTICS_HTML, {
                    responseType: 'blob'
                });
                downloadFile(response, 'sponsorenlauf_statistiken_interaktiv.html');
                showSuccess('HTML-Report erfolgreich exportiert');
            } else if (exportData.format === 'excel-complete') {
                // Für Excel-Complete die bestehende Route verwenden
                const response = await request(`${API_ENDPOINTS.EXPORT_EXCEL}?type=complete`, {
                    responseType: 'blob'
                });
                downloadFile(response, 'sponsorenlauf_gesamtauswertung.xlsx');
                showSuccess('Excel-Gesamtauswertung erfolgreich exportiert');
            } else if (exportData.format === 'excel-classes') {
                // Für Excel-Classes die bestehende Route verwenden
                const response = await request(`${API_ENDPOINTS.EXPORT_EXCEL}?type=class-wise`, {
                    responseType: 'blob'
                });
                downloadFile(response, 'sponsorenlauf_klassenweise.zip');
                showSuccess('Excel-Klassendateien erfolgreich exportiert');
            } else {
                // Für andere Formate die neue erweiterte API verwenden
                const response = await request('/api/advancedExport', {
                    method: 'POST',
                    data: exportData,
                    responseType: 'blob'
                });

                let filename = 'sponsorenlauf_export';
                switch (exportData.format) {
                    case 'pdf-summary':
                        filename += '.pdf';
                        break;
                    default:
                        filename += '.html';
                }

                downloadFile(response, filename);
                showSuccess('Export erfolgreich erstellt');
            }

            setExportDialogOpen(false);
        } catch (error) {
            showError(error, 'Beim Export der Auswertung');
        }
    }, [request, showError, showSuccess]);

    const handleExportButtonClick = useCallback(() => {
        setExportDialogOpen(true);
    }, []);



    // Spalten-Definitionen für Tabellen
    const classStatsColumns = [
        { key: 'klasse', label: 'Klasse', sortable: true },
        { key: 'totalRounds', label: 'Gesamt Runden', sortable: true },
        { key: 'averageRounds', label: 'Ø Runden', sortable: true, format: (val) => val?.toFixed(2) || '0' },
        ...(isDonationsEnabled ? [
            { key: 'totalMoney', label: `Gesamt ${donationMode === 'expected' ? 'Erwartete' : 'Erhaltene'} Spenden`, sortable: true, format: (val) => formatCurrency(val) },
            { key: 'averageMoney', label: `Ø ${donationMode === 'expected' ? 'Erwartete' : 'Erhaltene'} Spenden`, sortable: true, format: (val) => formatCurrency(val) }
        ] : [])
    ];

    const studentsByRoundsColumns = [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'klasse', label: 'Klasse', sortable: true },
        { key: 'vorname', label: 'Vorname', sortable: true },
        { key: 'nachname', label: 'Nachname', sortable: true },
        { key: 'geschlecht', label: 'Geschlecht', sortable: true },
        { key: 'rounds', label: 'Runden', sortable: true }
    ];

    const studentsByMoneyColumns = [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'klasse', label: 'Klasse', sortable: true },
        { key: 'vorname', label: 'Vorname', sortable: true },
        { key: 'nachname', label: 'Nachname', sortable: true },
        { key: 'geschlecht', label: 'Geschlecht', sortable: true },
        { key: 'spenden', label: `${donationMode === 'expected' ? 'Erwartete' : 'Erhaltene'} Spenden`, sortable: true, format: (val) => formatCurrency(val) }
    ];

    // Enhanced search functionality - fügt nicht-gefilterte Schüler zur Suche hinzu
    const enhanceDataWithSearch = useCallback((tableData, searchTerm, allStudents) => {
        if (!searchTerm || !allStudents) return tableData;

        // Finde Schüler, die dem Suchterm entsprechen, aber nicht in der aktuellen Liste sind
        const currentIds = new Set(tableData.map(item => item.id));
        const matchingMissingStudents = allStudents.filter(student =>
            !currentIds.has(student.id) &&
            Object.values(student).some(value =>
                value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        // Füge gefundene Schüler zur Liste hinzu
        if (matchingMissingStudents.length > 0) {
            return [...tableData, ...matchingMissingStudents];
        }

        return tableData;
    }, []);

    return (
        <div className="statistics-dashboard">
            <div className="statistics-hero">
                <div className="statistics-hero__content statistics-hero__content--centered">
                    <h1 className="page-title">📊 Statistiken Dashboard</h1>
                    <p className="statistics-hero__subtitle">
                        Sehen Sie auf einen Blick, wie stark die Beteiligung ist, welche Klassen vorne liegen und wo noch Handlungsbedarf besteht.
                    </p>
                </div>
                <div className="statistics-hero__actions">
                    {isDonationsEnabled && (
                        <span className="donation-mode-indicator">
                            Aktueller Modus: <strong>{donationMode === 'expected' ? 'Erwartete Spenden' : 'Erhaltene Spenden'}</strong>
                        </span>
                    )}
                    <button
                        className="btn btn--secondary"
                        onClick={handleExportButtonClick}
                        disabled={loading}
                        title="Exportiere detaillierte Excel-Dateien"
                    >
                        {loading ? '⏳ Exportiere...' : '📊 Excel Export'}
                    </button>
                </div>
            </div>

            {error && <div className="message message-error">{error}</div>}
            {!error && loading && stats.totalStudents === 0 ? <div className="message message-info">Statistiken werden geladen...</div> : null}

            {/* Haupt-Widgets */}
            <div className="statistics-section">
                <h2>
                    📋
                    Überblick
                </h2>
                <div className="statistics-widgets-grid">
                    {overviewWidgets.map((widget) => (
                        <StatisticsWidget key={widget.title} {...widget} />
                    ))}
                </div>
            </div>

            {genderOverviewCards.length > 0 && (
                <div className="statistics-section">
                    <h2>
                        ⚖️
                        Geschlechter-Überblick
                    </h2>
                    <div className="statistics-gender-grid">
                        {genderOverviewCards.map((item) => (
                            <article key={item.gender} className="statistics-gender-card">
                                <div className="statistics-gender-card__header">
                                    <div>
                                        <span className="statistics-gender-card__icon">{item.icon}</span>
                                        <h3>{item.label}</h3>
                                    </div>
                                    <strong>{item.participationRate.toFixed(1)}%</strong>
                                </div>
                                <div className="statistics-gender-card__metrics">
                                    <div>
                                        <span>Aktiv</span>
                                        <strong>{item.activeCount}/{item.count}</strong>
                                    </div>
                                    <div>
                                        <span>Ø Runden</span>
                                        <strong>{item.averageRoundsActive.toFixed(2)}</strong>
                                    </div>
                                    <div>
                                        <span>Ø Spenden</span>
                                        <strong>{formatCurrency(item.averageMoney)}</strong>
                                    </div>
                                </div>
                                <p className="statistics-gender-card__footer">
                                    {item.topRoundStudent
                                        ? `${item.topRoundStudent.vorname} ${item.topRoundStudent.nachname} führt mit ${item.topRoundStudent.rounds} Runden.`
                                        : 'Noch keine Rundenspitze vorhanden.'}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {dashboardHighlights.length > 0 && (
                <div className="statistics-section">
                    <h2>
                        🚨
                        Auffälligkeiten
                    </h2>
                    <div className="statistics-insights-grid">
                        {dashboardHighlights.map((item) => (
                            <article key={item.title} className={`statistics-insight-card statistics-insight-card--${item.tone}`}>
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {genderInsights.length > 0 && (
                <div className="statistics-section">
                    <h2>
                        🧩
                        Individuelle Aufschlüsselung
                    </h2>
                    <div className="statistics-insights-grid">
                        {genderInsights.map((item) => (
                            <article key={item.key} className="statistics-insight-card statistics-insight-card--primary">
                                <h3>{item.title}</h3>
                                <p>{item.text}</p>
                                <p className="statistics-insight-card__footer">{item.footer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {classComparisonCards.length > 0 && (
                <div className="statistics-section">
                    <h2>
                        🏫
                        Klassenvergleich
                    </h2>
                    <p className="statistics-section__intro">
                        Die führenden Klassen im direkten Vergleich nach Runden, Teilnahme und durchschnittlicher Leistung.
                    </p>
                    <div className="statistics-class-grid">
                        {classComparisonCards.map((classItem, index) => (
                            <article key={classItem.klasse} className="statistics-class-card">
                                <div className="statistics-class-card__header">
                                    <div>
                                        <span className="statistics-class-card__rank">#{index + 1}</span>
                                        <h3>{classItem.klasse}</h3>
                                    </div>
                                    <strong>{classItem.totalRounds} Runden</strong>
                                </div>
                                <div className="statistics-class-card__metrics">
                                    <div>
                                        <span>Teilnahme</span>
                                        <strong>{classItem.participationRate.toFixed(1)}%</strong>
                                    </div>
                                    <div>
                                        <span>Ø Runden</span>
                                        <strong>{classItem.averageRounds.toFixed(2)}</strong>
                                    </div>
                                    <div>
                                        <span>Aktive</span>
                                        <strong>{classItem.activeStudents}/{classItem.totalStudents}</strong>
                                    </div>
                                </div>
                                <div className="statistics-class-card__progress">
                                    <div
                                        className="statistics-class-card__progress-bar"
                                        style={{ width: `${Math.min(classItem.participationRate, 100)}%` }}
                                    ></div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailierte Statistiken */}
            <div className="statistics-section">
                <h2>
                    📈
                    Detailierte Tabellen
                </h2>

                {genderFilterOptions.length > 1 && (
                    <div className="statistics-filter-chips" aria-label="Geschlechterfilter">
                        {genderFilterOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`statistics-filter-chip ${selectedGenderFilter === option.value ? 'statistics-filter-chip--active' : ''}`}
                                onClick={() => setSelectedGenderFilter(option.value)}
                                aria-pressed={selectedGenderFilter === option.value}
                            >
                                <span>{option.icon}</span>
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}

                {selectedGenderBreakdown ? (
                    <div className="statistics-filter-summary">
                        Fokus auf <strong>{GENDER_LABELS[selectedGenderBreakdown.gender] || selectedGenderBreakdown.gender}</strong>: {selectedGenderBreakdown.activeCount} aktive Schüler, {selectedGenderBreakdown.highPerformers} davon mit 10+ Runden.
                    </div>
                ) : null}

                <StatisticsTable
                    data={stats.classStats || []}
                    title="📚 Klassen-Statistiken"
                    description="Vergleichen Sie Klassen nach Gesamtleistung, Durchschnitt und Teilnahmequote. Ideal für die schnelle Einordnung kompletter Jahrgänge."
                    columns={classStatsColumns}
                    defaultSort={{ key: 'totalRounds', direction: 'desc' }}
                    searchable={true}
                    className="statistics-table"
                    highlightTopRows={true}
                    emptyMessage="Keine Klassenstatistiken verfügbar."
                />

                <StatisticsTable
                    data={filteredTopStudentsByRounds}
                    columns={studentsByRoundsColumns}
                    title={selectedGenderFilter === 'all' ? '🏃‍♂️ Top Schüler nach Runden' : `🏃‍♂️ Top ${GENDER_LABELS[selectedGenderFilter] || selectedGenderFilter} nach Runden`}
                    description="Die stärksten Läuferinnen und Läufer des Tages. Über die Suche können Sie gezielt einzelne Schüler in die Liste holen."
                    defaultSort={{ key: 'rounds', direction: 'desc' }}
                    maxRows={25}
                    searchable={true}
                    className="statistics-table"
                    allData={filteredRawStudents}
                    onSearchEnhance={enhanceDataWithSearch}
                    highlightTopRows={true}
                    emptyMessage={selectedGenderFilter === 'all' ? 'Noch keine gelaufenen Runden vorhanden.' : `Für ${GENDER_LABELS[selectedGenderFilter] || selectedGenderFilter} sind noch keine gelaufenen Runden vorhanden.`}
                />

                {isDonationsEnabled && (
                    <StatisticsTable
                        data={filteredTopStudentsByMoney}
                        columns={studentsByMoneyColumns}
                        title={selectedGenderFilter === 'all'
                            ? `💰 Top Schüler nach ${donationMode === 'expected' ? 'Erwarteten' : 'Erhaltenen'} Spenden`
                            : `💰 Top ${GENDER_LABELS[selectedGenderFilter] || selectedGenderFilter} nach ${donationMode === 'expected' ? 'Erwarteten' : 'Erhaltenen'} Spenden`}
                        description={`Diese Rangliste zeigt die Spitzenplätze im aktuell aktiven Spendenmodus (${donationMode === 'expected' ? 'Erwartete Spenden' : 'Erhaltene Spenden'}).`}
                        defaultSort={{ key: 'spenden', direction: 'desc' }}
                        maxRows={25}
                        searchable={true}
                        className="statistics-table"
                        allData={filteredRawStudents}
                        onSearchEnhance={enhanceDataWithSearch}
                        highlightTopRows={true}
                        emptyMessage={selectedGenderFilter === 'all' ? 'Noch keine Spendenwerte vorhanden.' : `Für ${GENDER_LABELS[selectedGenderFilter] || selectedGenderFilter} sind noch keine Spendenwerte vorhanden.`}
                    />
                )}
            </div>

            {genderOverviewCards.length > 0 && (
                <div className="statistics-section">
                    <h2>
                        🏅
                        Spitzenwerte nach Geschlecht
                    </h2>
                    <div className="statistics-gender-leaderboards">
                        {genderOverviewCards.map((item) => {
                            const topRounds = stats.topStudentsByRoundsByGender?.[item.gender] || [];
                            const topMoney = stats.topStudentsByMoneyByGender?.[item.gender] || [];

                            return (
                                <article key={item.gender} className="statistics-gender-leaderboard-card">
                                    <div className="statistics-gender-leaderboard-card__header">
                                        <span className="statistics-gender-card__icon">{item.icon}</span>
                                        <h3>{item.label}</h3>
                                    </div>
                                    <div className="statistics-gender-leaderboard-card__section">
                                        <h4>Top Runden</h4>
                                        {topRounds.length > 0 ? (
                                            <ul className="statistics-mini-list">
                                                {topRounds.map((student) => (
                                                    <li key={`${item.gender}-rounds-${student.id}`}>
                                                        <span>{student.vorname} {student.nachname}</span>
                                                        <strong>{student.rounds}</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="statistics-empty-note">Keine Runden vorhanden.</p>
                                        )}
                                    </div>
                                    {isDonationsEnabled && (
                                        <div className="statistics-gender-leaderboard-card__section">
                                            <h4>Top Spenden</h4>
                                            {topMoney.length > 0 ? (
                                                <ul className="statistics-mini-list">
                                                    {topMoney.map((student) => (
                                                        <li key={`${item.gender}-money-${student.id}`}>
                                                            <span>{student.vorname} {student.nachname}</span>
                                                            <strong>{formatCurrency(student.spenden)}</strong>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="statistics-empty-note">Keine Spendenwerte vorhanden.</p>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </div>
            )}

            {genderActivityCards.length > 0 && (
                <div className="statistics-section">
                    <h2>
                        🔍
                        Aktivitätsgruppen nach Geschlecht
                    </h2>
                    <div className="statistics-activity-grid">
                        {genderActivityCards.map((item) => (
                            <article key={item.gender} className="statistics-activity-card">
                                <div className="statistics-activity-card__header">
                                    <span className="statistics-gender-card__icon">{item.icon}</span>
                                    <h3>{item.label}</h3>
                                </div>
                                <div className="statistics-activity-card__metrics">
                                    <div>
                                        <span>Ohne Runden</span>
                                        <strong>{item.distribution.inactive || 0}</strong>
                                    </div>
                                    <div>
                                        <span>1-4 Runden</span>
                                        <strong>{item.distribution.lowPerformers || 0}</strong>
                                    </div>
                                    <div>
                                        <span>5-9 Runden</span>
                                        <strong>{item.distribution.mediumPerformers || 0}</strong>
                                    </div>
                                    <div>
                                        <span>10+ Runden</span>
                                        <strong>{item.distribution.highPerformers || 0}</strong>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {/* Klassen nach Stufen */}
            {gradeLeaders.length > 0 && (
                <div className="statistics-section">
                    <h2>
                        🥇
                        Stufen-Sieger
                    </h2>
                    <div className="statistics-grade-leaders">
                        {gradeLeaders.map(({ grade, leader }) => (
                            <article key={grade} className="statistics-grade-card">
                                <span className="statistics-grade-card__label">Stufe {grade}</span>
                                <h3>{leader.klasse}</h3>
                                <p>{leader.totalRounds} Runden · {leader.activeStudents}/{leader.totalStudents} aktive Schüler</p>
                            </article>
                        ))}
                    </div>
                    {Object.entries(stats.topClassesOfGrades).map(([grade, classes]) => (
                        <StatisticsTable
                            key={grade}
                            data={classes}
                            columns={classStatsColumns}
                            title={`Stufe ${grade}`}
                            description={`Vergleich aller Klassen innerhalb der Stufe ${grade}.`}
                            defaultSort={{ key: 'totalRounds', direction: 'desc' }}
                            maxRows={10}
                            className="statistics-table"
                            emptyMessage={`Keine Klassendaten für Stufe ${grade} vorhanden.`}
                        />
                    ))}
                </div>
            )}

            <AdvancedExportDialog
                isOpen={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                onExport={handleExport}
                loading={loading}
                statistics={stats}
            />
        </div>
    );
}
