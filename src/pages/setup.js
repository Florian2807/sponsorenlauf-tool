import { useState, useRef, useEffect, useCallback } from 'react';
import { API_ENDPOINTS, downloadFile } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { useGlobalError } from '../contexts/ErrorContext';
import GenerateLabelsDialog from '../components/dialogs/setup/GenerateLabelsDialog';
import ExportSpendenDialog from '../components/dialogs/setup/ExportSpendenDialog';
import ConfirmDeleteAllDialog from '../components/dialogs/setup/ConfirmDeleteAllDialog';
import ClassStructureDialog from '../components/dialogs/setup/ClassStructureDialog';
import DataImportDialog from '../components/dialogs/setup/DataImportDialog';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [insertedCount, setInsertedCount] = useState(0);
    const [replacementAmount, setReplacementAmount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [classStructure, setClassStructure] = useState({});
    const [tempClassStructure, setTempClassStructure] = useState({});
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { loading, executeAsync, setLoadingState } = useAsyncOperation({
        upload: false,
        labels: false,
        replacement: false,
        downloadResults: false
    });

    const generateLabelsPopup = useRef(null);
    const confirmDeletePopup = useRef(null);
    const exportSpendenPopup = useRef(null);
    const classStructurePopup = useRef(null);
    const dataImportPopup = useRef(null);

    const fetchClasses = useCallback(async () => {
        try {
            const data = await request('/api/getClasses');
            setClasses(data);
        } catch (error) {
            showError(error, 'Beim Abrufen der Klassen');
        }
    }, [request, showError]);

    const fetchClassStructure = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE);
            setClassStructure(data);
            setSelectedClasses(Object.values(data).flat());
        } catch (error) {
            showError(error, 'Beim Abrufen der Klassenstruktur');
        }
    }, [request]);

    useEffect(() => {
        fetchClasses();
        fetchClassStructure();
    }, [fetchClasses, fetchClassStructure]);

    const handleImportSuccess = (count) => {
        setInsertedCount(count);
        dataImportPopup.current.close();
        fetchClasses(); // Refresh classes in case new ones were added
    };

    const handleDataImportClose = () => {
        dataImportPopup.current.close();
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

    const handleDeleteAllStudents = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.DELETE_ALL_STUDENTS, { 
                method: 'DELETE',
                errorContext: 'Beim Löschen aller Schüler'
            });
            showSuccess('Alle Schüler wurden erfolgreich gelöscht.', 'Schüler löschen');
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        } finally {
            confirmDeletePopup.current.close();
        }
    }, [request, showSuccess]);

    const downloadResults = useCallback(async (type) => {
        const downloadOperation = async () => {
            const response = await request(API_ENDPOINTS.EXPORT_SPENDEN, {
                responseType: 'blob',
                params: { requestedType: type },
                errorContext: 'Beim Herunterladen der Excel-Datei'
            });
            return response;
        };

        try {
            const response = await executeAsync(downloadOperation, 'downloadResults');
            const filename = type === 'allstudents' ? 'Auswertung_Gesamt.xlsx' : 'Auswertung_Klassen.xlsx';
            downloadFile(response, filename);
            showSuccess(`${filename} erfolgreich heruntergeladen.`, 'Excel-Export');
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    }, [request, executeAsync, showSuccess]);

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
        classStructurePopup.current.showModal();
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
                classStructurePopup.current.close();
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
                            <button
                                onClick={() => window.open('/teachers', '_self')}
                                className="setup-action-btn"
                                title="Konfiguriere die E-Mail-Adressen und Klassen der Lehrer."
                            >
                                <span className="setup-btn-icon">👨‍🏫</span>
                                <span className="setup-btn-text">Lehrer Verwaltung</span>
                            </button>

                            <button
                                onClick={openClassStructurePopup}
                                className="setup-action-btn"
                                title="Konfiguriere die Struktur der Jahrgänge und Klassen."
                            >
                                <span className="setup-btn-icon">🏫</span>
                                <span className="setup-btn-text">Klassenstruktur</span>
                            </button>

                            <button
                                onClick={() => dataImportPopup.current.showModal()}
                                className="setup-action-btn"
                                disabled={loading.upload}
                            >
                                <span className="setup-btn-icon">📥</span>
                                <span className="setup-btn-text">Schüler importieren</span>
                            </button>

                            <button
                                onClick={() => confirmDeletePopup.current.showModal()}
                                className="setup-action-btn setup-action-btn-danger"
                            >
                                <span className="setup-btn-icon">🗑️</span>
                                <span className="setup-btn-text">Alle Schüler löschen</span>
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
                                onClick={() => generateLabelsPopup.current.showModal()}
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
                            <button
                                onClick={() => window.open('/mails', '_self')}
                                className="setup-action-btn"
                                title="Versendet eine E-Mail mit den gelaufenen Runden aller Schüler an die jeweiligen Klassenlehrer."
                            >
                                <span className="setup-btn-icon">📧</span>
                                <span className="setup-btn-text">E-Mails versenden</span>
                            </button>

                            <button
                                onClick={() => window.open('/donations', '_self')}
                                className="setup-action-btn"
                            >
                                <span className="setup-btn-icon">💰</span>
                                <span className="setup-btn-text">Spenden eintragen</span>
                            </button>

                            <button
                                onClick={() => exportSpendenPopup.current.showModal()}
                                className="setup-action-btn"
                            >
                                <span className="setup-btn-icon">📊</span>
                                <span className="setup-btn-text">Spenden-Export</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <GenerateLabelsDialog
                dialogRef={generateLabelsPopup}
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
                dialogRef={dataImportPopup}
                onImportSuccess={handleImportSuccess}
                onClose={handleDataImportClose}
            />

            <ExportSpendenDialog
                dialogRef={exportSpendenPopup}
                downloadResults={downloadResults}
                loading={loading}
            />

            <ConfirmDeleteAllDialog
                dialogRef={confirmDeletePopup}
                handleDeleteAllStudents={handleDeleteAllStudents}
            />

            <ClassStructureDialog
                dialogRef={classStructurePopup}
                tempClassStructure={tempClassStructure}
                handleGradeNameChange={handleGradeNameChange}
                removeGrade={removeGrade}
                handleClassNameChange={handleClassNameChange}
                removeClassFromGrade={removeClassFromGrade}
                addClassToGrade={addClassToGrade}
                addGrade={addGrade}
                saveClassStructure={saveClassStructure}
            />
        </div >
    );
}