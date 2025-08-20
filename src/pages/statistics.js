import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, API_ENDPOINTS, downloadFile } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useDonationDisplayMode } from '../contexts/DonationDisplayModeContext';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import StatisticsWidget from '../components/statistics/StatisticsWidget';
import StatisticsTable from '../components/statistics/StatisticsTable';
import ExportDialog from '../components/dialogs/statistics/ExportDialog';

export default function Statistics() {
    const [stats, setStats] = useState({
        classStats: [],
        topStudentsByRounds: [],
        topStudentsByMoney: [],
        topClassesOfGrades: {},
        averageRounds: 0,
        totalRounds: 0,
        totalStudents: 0,
        activeStudents: 0,
        totalDonations: 0,
        rawStudents: []
    });
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    const { request, loading, error } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { mode: donationMode } = useDonationDisplayMode();
    const { isDonationsEnabled } = useModuleConfig();

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

    const handleExport = useCallback(async (exportType) => {
        try {
            const response = await request(`${API_ENDPOINTS.EXPORT_EXCEL}?type=${exportType}`, {
                responseType: 'blob'
            });

            const filename = exportType === 'complete'
                ? 'sponsorenlauf_gesamtauswertung.xlsx'
                : 'sponsorenlauf_klassenweise.zip';

            downloadFile(response, filename);
            showSuccess(`Statistiken erfolgreich exportiert (${exportType === 'complete' ? 'Gesamtauswertung' : 'Klassenweise'})`);
            setExportDialogOpen(false);
        } catch (error) {
            showError(error, 'Beim Export der Excel-Dateien');
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
            <div className="page-header">
                <h1 className="page-title">
                    📊
                    Statistiken Dashboard
                </h1>
                <div className="page-info">
                    {isDonationsEnabled && (
                        <span className="donation-mode-indicator">
                            Aktueller Modus: <strong>{donationMode === 'expected' ? 'Erwartete Spenden' : 'Erhaltene Spenden'}</strong>
                        </span>
                    )}
                </div>
                <div className="page-actions">
                    <button
                        className="btn btn--secondary"
                        onClick={handleExportButtonClick}
                        disabled={loading}
                        title="Exportiere detaillierte Excel-Dateien"
                    >
                        {loading ? (
                            <>
                                ⏳
                                Exportiere...
                            </>
                        ) : (
                            <>
                                📊
                                Excel Export
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && <div className="message message-error">{error}</div>}

            {/* Haupt-Widgets */}
            <div className="statistics-section">
                <h2>
                    📋
                    Überblick
                </h2>
                <div className="statistics-widgets-grid">
                    <StatisticsWidget
                        title="Gesamte Runden"
                        value={stats.totalRounds}
                        icon="🔄"
                        color="primary"
                        format="number"
                    />
                    <StatisticsWidget
                        title="Aktive Schüler"
                        value={stats.activeStudents}
                        subvalue={`von ${stats.totalStudents} Schülern`}
                        icon="👥"
                        color="success"
                        format="number"
                    />
                    <StatisticsWidget
                        title="Ø Runden pro Schüler"
                        value={stats.averageRounds}
                        icon="📊"
                        color="warning"
                        format="decimal"
                    />
                    {isDonationsEnabled && (
                        <StatisticsWidget
                            title={`Gesamte ${donationMode === 'expected' ? 'Erwartete' : 'Erhaltene'} Spenden`}
                            value={stats.totalDonations}
                            icon="💰"
                            color="success"
                            format="currency"
                        />
                    )}
                </div>
            </div>

            {/* Detailierte Statistiken */}
            <div className="statistics-section">
                <h2>
                    📈
                    Detailierte Statistiken
                </h2>

                <StatisticsTable
                    data={stats.classStats || []}
                    title="📚 Klassen-Statistiken"
                    columns={classStatsColumns}
                    defaultSort={{ key: 'totalRounds', direction: 'desc' }}
                    searchable={true}
                    className="statistics-table"
                />

                <StatisticsTable
                    data={stats.topStudentsByRounds || []}
                    columns={studentsByRoundsColumns}
                    title="🏃‍♂️ Top Schüler nach Runden"
                    defaultSort={{ key: 'rounds', direction: 'desc' }}
                    maxRows={25}
                    searchable={true}
                    className="statistics-table"
                    allData={stats.rawStudents}
                    onSearchEnhance={enhanceDataWithSearch}
                />

                {isDonationsEnabled && (
                    <StatisticsTable
                        data={stats.topStudentsByMoney || []}
                        columns={studentsByMoneyColumns}
                        title={`💰 Top Schüler nach ${donationMode === 'expected' ? 'Erwarteten' : 'Erhaltenen'} Spenden`}
                        defaultSort={{ key: 'spenden', direction: 'desc' }}
                        maxRows={25}
                        searchable={true}
                        className="statistics-table"
                        allData={stats.rawStudents}
                        onSearchEnhance={enhanceDataWithSearch}
                    />
                )}
            </div>

            {/* Klassen nach Stufen */}
            {Object.keys(stats.topClassesOfGrades || {}).length > 0 && (
                <div className="statistics-section">
                    <h2>
                        🏫
                        Top Klassen nach Stufen
                    </h2>
                    {Object.entries(stats.topClassesOfGrades).map(([grade, classes]) => (
                        <StatisticsTable
                            key={grade}
                            data={classes}
                            columns={classStatsColumns}
                            title={`Stufe ${grade}`}
                            defaultSort={{ key: 'totalRounds', direction: 'desc' }}
                            maxRows={10}
                            className="statistics-table"
                        />
                    ))}
                </div>
            )}

            <ExportDialog
                isOpen={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                onExport={handleExport}
                loading={loading}
            />
        </div>
    );
}