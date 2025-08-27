import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS, downloadFile } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { useGlobalError } from '../contexts/ErrorContext';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import { useDialogs } from '../hooks/useDialogs';
import GenerateLabelsDialog from '../components/dialogs/setup/GenerateLabelsDialog';
import AdvancedExportDialog from '../components/dialogs/statistics/AdvancedExportDialog';
import DetailedDeleteDialog from '../components/dialogs/setup/DetailedDeleteDialog';
import ClassStructureDialog from '../components/dialogs/setup/ClassStructureDialog';
import DataImportDialog from '../components/dialogs/setup/DataImportDialog';
import ModuleSettingsDialog from '../components/dialogs/setup/ModuleSettingsDialog';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [insertedCount, setInsertedCount] = useState(0);
    const [replacementAmount, setReplacementAmount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [classStructure, setClassStructure] = useState({});
    const [tempClassStructure, setTempClassStructure] = useState({});
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [stats, setStats] = useState(null);

    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { isDonationsEnabled, isEmailsEnabled, isTeachersEnabled } = useModuleConfig();
    const { loading, executeAsync, setLoadingState } = useAsyncOperation({
        upload: false,
        labels: false,
        replacement: false,
        downloadResults: false
    });

    // Dialog-Management
    const { refs: dialogRefs, openDialog, closeDialog } = useDialogs([
        'generateLabels', 'detailedDelete',
        'classStructure', 'dataImport', 'moduleSettings'
    ]);

    // Fetch-Funktionen mit useCallback für stabile Referenzen
    const fetchClasses = useCallback(async () => {
        try {
            const data = await request('/api/getClasses', { errorContext: 'Beim Abrufen der Klassen' });
            setClasses(data);
            return data;
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            return null;
        }
    }, [request]);

    const fetchClassStructure = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE);
            setClassStructure(data);
            setSelectedClasses(Object.values(data).flat());
        } catch (error) {
            showError(error, 'Beim Abrufen der Klassenstruktur');
        }
    }, [request, showError]);

    useEffect(() => {
        fetchClasses();
        fetchClassStructure();
    }, [fetchClasses, fetchClassStructure]);

    const handleImportSuccess = (count) => {
        setInsertedCount(count);
        closeDialog('dataImport');
        fetchClasses(); // Refresh classes in case new ones were added
    };

    const handleGenerateLabels = useCallback(async () => {
        const generateOperation = async () => {
            const response = await request(API_ENDPOINTS.GENERATE_LABELS, {
                responseType: 'blob',
                params: {
                    replacementAmount,
                    selectedClasses: selectedClasses.join(',')
                },
                errorContext: 'Beim Generieren der Etiketten'
            });
            return response;
        };

        try {
            const response = await executeAsync(generateOperation, 'labels');
            downloadFile(response, 'labels.pdf');
            showSuccess('Etiketten erfolgreich generiert und heruntergeladen.', 'Etiketten-Generierung');
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    }, [replacementAmount, selectedClasses, request, executeAsync, showSuccess]);

    const handleDeleteSuccess = useCallback(() => {
        closeDialog('detailedDelete');
        fetchClasses();
        fetchClassStructure();
        setInsertedCount(0);
        showSuccess('Löschvorgang erfolgreich abgeschlossen.', 'Daten gelöscht');
    }, [closeDialog, fetchClasses, fetchClassStructure, showSuccess]);

    const handleExport = useCallback(async (exportData) => {
        try {
            if (exportData.format === 'excel-spenden-klassen') {
                // Für die neue klassenweise Spendenauswertung
                const response = await request('/api/exportSpendenKlassen', {
                    responseType: 'blob'
                });
                downloadFile(response, 'klassenauswertungen_spenden.xlsx');
                showSuccess('Klassenweise Spendenauswertung erfolgreich exportiert');
            } else if (exportData.format === 'html') {
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

    const handleClassSelection = (e) => {
        const value = e.target.value;
        setSelectedClasses((prev) =>
            prev.includes(value) ? prev.filter((cls) => cls !== value) : [...prev, value]
        );
    };

    const handleSelectAll = () => {
        setSelectedClasses(classes);
    };

    const handleDeselectAll = () => {
        setSelectedClasses([]);
    };

    const openClassStructurePopup = () => {
        setTempClassStructure(JSON.parse(JSON.stringify(classStructure)));
        openDialog('classStructure');
    };

    const handleGradeNameChange = (oldGrade, newGrade) => {
        if (oldGrade === newGrade || !newGrade.trim()) return;

        // Erstelle neue Struktur und ersetze den Grade-Namen
        const newStructure = {};
        Object.keys(tempClassStructure).forEach(grade => {
            if (grade === oldGrade) {
                newStructure[newGrade] = tempClassStructure[oldGrade];
            } else {
                newStructure[grade] = tempClassStructure[grade];
            }
        });

        setTempClassStructure(newStructure);
    };

    const addGrade = () => {
        const newGrade = `Jahrgang ${Object.keys(tempClassStructure).length + 1}`;
        setTempClassStructure({
            ...tempClassStructure,
            [newGrade]: []
        });
    };

    const removeGrade = (grade) => {
        const newStructure = { ...tempClassStructure };
        delete newStructure[grade];
        setTempClassStructure(newStructure);
    };

    const addClassToGrade = (grade) => {
        setTempClassStructure({
            ...tempClassStructure,
            [grade]: [...(tempClassStructure[grade] || []), `${grade}${String.fromCharCode(97 + tempClassStructure[grade].length)}`]
        });
    };

    const removeClassFromGrade = (grade, classIndex) => {
        const newClasses = tempClassStructure[grade].filter((_, index) => index !== classIndex);
        setTempClassStructure({
            ...tempClassStructure,
            [grade]: newClasses
        });
    };

    const handleClassNameChange = (grade, classIndex, newName) => {
        const newClasses = [...tempClassStructure[grade]];
        newClasses[classIndex] = newName;
        setTempClassStructure({
            ...tempClassStructure,
            [grade]: newClasses
        });
    };

    const saveClassStructure = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE, {
                method: 'PUT',
                data: { availableClasses: tempClassStructure },
                errorContext: 'Beim Speichern der Klassenstruktur'
            });

            if (data.success) {
                setClassStructure(tempClassStructure);
                setSelectedClasses(Object.values(tempClassStructure).flat());
                showSuccess('Klassenstruktur erfolgreich gespeichert.', 'Klassenstruktur');
                closeDialog('classStructure');
            }
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    }, [request, tempClassStructure, showSuccess]);

    return (
        <div className="page-container-extra-wide">
            <div className="setup-header">
                <h1 className="setup-title">Setup & Verwaltung</h1>
                <p className="setup-subtitle">Verwalten Sie Ihre Sponsorenlauf-Daten und -Einstellungen</p>
            </div>

            <div className="setup-grid">
                <div className="setup-card">
                    <div className="setup-card-header">
                        <h2 className="setup-card-title">📊 Datenbank</h2>
                        <p className="setup-card-description">Verwalten Sie Schüler, Lehrer und Klassenstrukturen</p>
                    </div>
                    <div className="setup-card-content">
                        <div className="setup-actions">
                            {isTeachersEnabled && (
                                <button
                                    onClick={() => window.open('/teachers', '_self')}
                                    className="setup-action-btn"
                                    title="Konfiguriere die E-Mail-Adressen und Klassen der Lehrer."
                                >
                                    <span className="setup-btn-icon">👨‍🏫</span>
                                    <span className="setup-btn-text">Lehrer Verwaltung</span>
                                </button>
                            )}

                            <button
                                onClick={openClassStructurePopup}
                                className="setup-action-btn"
                                title="Konfiguriere die Struktur der Jahrgänge und Klassen."
                            >
                                <span className="setup-btn-icon">🏫</span>
                                <span className="setup-btn-text">Klassenstruktur</span>
                            </button>

                            <button
                                onClick={() => openDialog('dataImport')}
                                className="setup-action-btn"
                                disabled={loading.upload}
                            >
                                <span className="setup-btn-icon">📥</span>
                                <span className="setup-btn-text">Schüler importieren</span>
                            </button>

                            <button
                                onClick={() => openDialog('detailedDelete')}
                                className="setup-action-btn setup-action-btn-danger"
                                title="Erweiterte Löschoptionen - wählen Sie detailliert aus, welche Daten gelöscht werden sollen."
                            >
                                <span className="setup-btn-icon">🗑️</span>
                                <span className="setup-btn-text">Daten löschen</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="setup-card">
                    <div className="setup-card-header">
                        <h2 className="setup-card-title">🏷️ Etiketten</h2>
                        <p className="setup-card-description">Generieren Sie Barcode-Etiketten für den Sponsorenlauf</p>
                    </div>
                    <div className="setup-card-content">
                        <div className="setup-actions">
                            <button
                                onClick={() => openDialog('generateLabels')}
                                className="setup-action-btn"
                                disabled={loading.replacement}
                            >
                                <span className="setup-btn-icon">📄</span>
                                <span className="setup-btn-text">Etiketten generieren</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="setup-card">
                    <div className="setup-card-header">
                        <h2 className="setup-card-title">📈 Auswertungen</h2>
                        <p className="setup-card-description">Exportieren und versenden Sie Ergebnisse</p>
                    </div>
                    <div className="setup-card-content">
                        <div className="setup-actions">
                            {isEmailsEnabled && (
                                <button
                                    onClick={() => window.open('/mails', '_self')}
                                    className="setup-action-btn"
                                    title="Versendet eine E-Mail mit den gelaufenen Runden aller Schüler an die jeweiligen Klassenlehrer."
                                >
                                    <span className="setup-btn-icon">📧</span>
                                    <span className="setup-btn-text">E-Mails versenden</span>
                                </button>
                            )}

                            {isDonationsEnabled && (
                                <button
                                    onClick={() => window.open('/donations', '_self')}
                                    className="setup-action-btn"
                                >
                                    <span className="setup-btn-icon">💰</span>
                                    <span className="setup-btn-text">Spenden eintragen</span>
                                </button>
                            )}

                            {isDonationsEnabled && (
                                <button
                                    onClick={handleExportButtonClick}
                                    className="setup-action-btn"
                                >
                                    <span className="setup-btn-icon">📊</span>
                                    <span className="setup-btn-text">Auswertungen exportieren</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="setup-card">
                    <div className="setup-card-header">
                        <h2 className="setup-card-title">⚙️ Einstellungen</h2>
                        <p className="setup-card-description">Konfigurieren Sie Anzeige- und Berechnungsoptionen</p>
                    </div>
                    <div className="setup-card-content">
                        <div className="setup-actions">
                            <button
                                onClick={() => openDialog('moduleSettings')}
                                className="setup-action-btn"
                                title="Aktivieren oder deaktivieren Sie einzelne Module der Anwendung."
                            >
                                <span className="setup-btn-icon">🔧</span>
                                <span className="setup-btn-text">Module verwalten</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <GenerateLabelsDialog
                dialogRef={dialogRefs.generateLabelsRef}
                replacementAmount={replacementAmount}
                setReplacementAmount={setReplacementAmount}
                handleSelectAll={handleSelectAll}
                handleDeselectAll={handleDeselectAll}
                classes={classes}
                selectedClasses={selectedClasses}
                handleClassSelection={handleClassSelection}
                loading={loading}
                handleGenerateLabels={handleGenerateLabels}
            />

            <DataImportDialog
                dialogRef={dialogRefs.dataImportRef}
                onImportSuccess={handleImportSuccess}
                onClose={() => closeDialog('dataImport')}
            />

            {isDonationsEnabled && (
                <AdvancedExportDialog
                    isOpen={exportDialogOpen}
                    onClose={() => setExportDialogOpen(false)}
                    onExport={handleExport}
                    showSpendenExport={true}
                    loading={loading.downloadResults}
                    statistics={stats}
                />
            )}

            <DetailedDeleteDialog
                dialogRef={dialogRefs.detailedDeleteRef}
                onDeleteSuccess={handleDeleteSuccess}
            />

            <ClassStructureDialog
                dialogRef={dialogRefs.classStructureRef}
                tempClassStructure={tempClassStructure}
                handleGradeNameChange={handleGradeNameChange}
                removeGrade={removeGrade}
                handleClassNameChange={handleClassNameChange}
                removeClassFromGrade={removeClassFromGrade}
                addClassToGrade={addClassToGrade}
                addGrade={addGrade}
                saveClassStructure={saveClassStructure}
            />

            <ModuleSettingsDialog
                dialogRef={dialogRefs.moduleSettingsRef}
            />
        </div>
    );
}