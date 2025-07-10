import { useState, useRef, useEffect, useCallback } from 'react';
import { API_ENDPOINTS, downloadFile } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import GenerateLabelsDialog from '../components/dialogs/setup/GenerateLabelsDialog';
import ExportSpendenDialog from '../components/dialogs/setup/ExportSpendenDialog';
import ConfirmDeleteAllDialog from '../components/dialogs/setup/ConfirmDeleteAllDialog';
import ClassStructureDialog from '../components/dialogs/setup/ClassStructureDialog';
import DataImportDialog from '../components/dialogs/setup/DataImportDialog';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState({ download: '', upload: '', replacement: '', delete: '' });
    const [insertedCount, setInsertedCount] = useState(0);
    const [replacementAmount, setReplacementAmount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [classStructure, setClassStructure] = useState({});
    const [tempClassStructure, setTempClassStructure] = useState({});
    const { request } = useApi();
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
            console.error('Fehler beim Abrufen der Klassen:', error);
        }
    }, [request]);

    const fetchClassStructure = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE);
            setClassStructure(data);
            setSelectedClasses(Object.values(data).flat());
        } catch (error) {
            console.error('Fehler beim Abrufen der Klassenstruktur:', error);
        }
    }, [request]);

    useEffect(() => {
        fetchClasses();
        fetchClassStructure();
    }, [fetchClasses, fetchClassStructure]);

    const updateMessage = (updates = {}) => {
        setMessage(prev => ({ ...prev, ...updates }));
    };

    const handleImportSuccess = (count) => {
        setInsertedCount(count);
        updateMessage({ upload: `Import erfolgreich! ${count} Schüler hinzugefügt.` });
        dataImportPopup.current.close();
        fetchClasses(); // Refresh classes in case new ones were added
    };

    const handleDataImportClose = () => {
        dataImportPopup.current.close();
    };

    const handleGenerateLabels = useCallback(async () => {
        updateMessage({ download: 'Etiketten werden generiert...' });

        const generateOperation = async () => {
            const response = await request(API_ENDPOINTS.GENERATE_LABELS, {
                responseType: 'blob',
                params: {
                    replacementAmount,
                    selectedClasses: selectedClasses.join(',')
                }
            });
            return response;
        };

        try {
            const response = await executeAsync(generateOperation, 'labels');
            downloadFile(response, 'labels.pdf');
            updateMessage({ download: 'Etiketten erfolgreich generiert und heruntergeladen.' });
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ download: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        }
    }, [replacementAmount, selectedClasses, request, executeAsync]);

    const handleDeleteAllStudents = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.DELETE_ALL_STUDENTS, { method: 'DELETE' });
            updateMessage({ delete: 'Alle Schüler wurden erfolgreich gelöscht.' });
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ delete: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        } finally {
            confirmDeletePopup.current.close();
        }
    }, [request]);

    const downloadResults = useCallback(async (type) => {
        const downloadOperation = async () => {
            const response = await request(API_ENDPOINTS.EXPORT_SPENDEN, {
                responseType: 'blob',
                params: { requestedType: type }
            });
            return response;
        };

        try {
            const response = await executeAsync(downloadOperation, 'downloadResults');
            const filename = type === 'allstudents' ? 'Auswertung_Gesamt.xlsx' : 'Auswertung_Klassen.xlsx';
            downloadFile(response, filename);
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ download: 'Fehler beim Herunterladen der Excel-Datei.' });
        }
    }, [request, executeAsync]);

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
                data: { availableClasses: tempClassStructure }
            });

            if (data.success) {
                setClassStructure(tempClassStructure);
                setSelectedClasses(Object.values(tempClassStructure).flat());
                updateMessage({ upload: 'Klassenstruktur erfolgreich gespeichert.' });
                classStructurePopup.current.close();
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Klassenstruktur:', error);
            updateMessage({ upload: 'Fehler beim Speichern der Klassenstruktur.' });
        }
    }, [request, tempClassStructure]);

    return (
        <div className="page-container-extra-wide">
            <h1 className="page-title">Setup</h1>

            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Datenbank</h2>
                </div>

                <div className="btn-group btn-stack">
                    <button
                        onClick={() => window.open('/teachers', '_self')}
                        className="btn btn-sm"
                        title="Konfiguriere die E-Mail-Adressen und Klassen der Lehrer."
                    >
                        Lehrer Verwaltung
                    </button>

                    <button
                        onClick={openClassStructurePopup}
                        className="btn btn-sm"
                        title="Konfiguriere die Struktur der Jahrgänge und Klassen."
                    >
                        Klassenstruktur verwalten
                    </button>

                    <button
                        onClick={() => dataImportPopup.current.showModal()}
                        className="btn btn-sm"
                        disabled={loading.upload}
                    >
                        Schüler importieren
                    </button>

                    <button
                        onClick={() => confirmDeletePopup.current.showModal()}
                        className="btn btn-danger btn-sm"
                    >
                        Alle Schüler löschen
                    </button>
                </div>

                {message.delete && <p className="message message-info">{message.delete}</p>}
                {message.upload && <p className="message message-info">{message.upload}</p>}
            </div>

            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Etiketten</h2>
                </div>
                <button
                    onClick={() => generateLabelsPopup.current.showModal()}
                    className="btn btn-sm"
                    disabled={loading.replacement}
                >
                    Etiketten generieren
                </button>
            </div>

            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Auswertungen</h2>
                </div>
                <div className="btn-group btn-stack">
                    <button
                        onClick={() => window.open('/mails', '_self')}
                        className="btn btn-sm"
                        title="Versendet eine E-Mail mit den gelaufenen Runden aller Schüler an die jeweiligen Klassenlehrer."
                    >
                        gelaufene Runden per Mail versenden
                    </button>
                    <button onClick={() => window.open('/donations', '_self')} className="btn btn-sm">
                        Spenden eintragen
                    </button>
                    <button onClick={() => exportSpendenPopup.current.showModal()} className="btn btn-sm">
                        Spenden-Auswertungen downloaden
                    </button>
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
                message={message}
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
                message={message}
                saveClassStructure={saveClassStructure}
            />
        </div >
    );
}