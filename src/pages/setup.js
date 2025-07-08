import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/Setup.module.css';
import axios from 'axios';
import GenerateLabelsDialog from '../components/dialogs/setup/GenerateLabelsDialog';
import ImportExcelDialog from '../components/dialogs/setup/ImportExcelDialog';
import ExportSpendenDialog from '../components/dialogs/setup/ExportSpendenDialog';
import ConfirmDeleteAllDialog from '../components/dialogs/setup/ConfirmDeleteAllDialog';
import ClassStructureDialog from '../components/dialogs/setup/ClassStructureDialog';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState({ download: '', upload: '', replacement: '', delete: '' });
    const [insertedCount, setInsertedCount] = useState(0);
    const [loading, setLoading] = useState({ upload: false, labels: false, replacement: false, downloadResults: false });
    const [replacementAmount, setReplacementAmount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [classStructure, setClassStructure] = useState({});
    const [tempClassStructure, setTempClassStructure] = useState({});

    const generateLabelsPopup = useRef(null);
    const confirmDeletePopup = useRef(null);
    const importExcelPopup = useRef(null);
    const exportSpendenPopup = useRef(null);
    const classStructurePopup = useRef(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await axios.get('/api/getClasses');
                setClasses(response.data);
            } catch (error) {
                console.error('Fehler beim Abrufen der Klassen:', error);
            }
        };

        const fetchClassStructure = async () => {
            try {
                const response = await axios.get('/api/classStructure');
                setClassStructure(response.data);
                setSelectedClasses(Object.values(response.data).flat());
            } catch (error) {
                console.error('Fehler beim Abrufen der Klassenstruktur:', error);
            }
        };

        fetchClasses();
        fetchClassStructure();
    }, []);

    const updateMessage = (update = {}) => {
        setMessage((prev) => ({
            ...prev,
            ...Object.keys(prev).reduce((acc, key) => {
                acc[key] = update[key] || '';
                return acc;
            }, {})
        }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setInsertedCount(0);
        updateMessage();
    };

    const handleUploadExcel = async (e) => {
        e.preventDefault();
        if (!file) {
            updateMessage({ upload: 'Bitte wählen Sie eine Excel-Datei aus.' });
            return;
        }

        setLoading((prev) => ({ ...prev, upload: true }));
        const formData = new FormData();
        formData.append('file', file);

        try {
            const importResponse = await fetch('/api/uploadExcel', {
                method: 'POST',
                body: formData,
            });

            if (!importResponse.ok) {
                const errorData = await importResponse.json();
                updateMessage({ upload: `Fehler beim Importieren der Excel-Datei: ${errorData.message}` });
                setLoading((prev) => ({ ...prev, upload: false }));
                return;
            }

            const responseData = await importResponse.json();
            setInsertedCount(responseData.count);
            updateMessage({ upload: `Excel-Datei erfolgreich hochgeladen und ${responseData.count} Datensätze in die Datenbank eingefügt.` });
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ upload: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        } finally {
            setLoading((prev) => ({ ...prev, upload: false }));
        }
    };

    const handleGenerateLabels = async () => {
        setLoading((prev) => ({ ...prev, labels: true }));
        updateMessage({ download: 'Etiketten werden generiert...' });

        try {
            const response = await axios.get('/api/generate-labels', {
                responseType: 'blob',
                params: { replacementAmount, selectedClasses: selectedClasses.join(',') }
            });
            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'labels.pdf');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                updateMessage({ download: 'Etiketten erfolgreich generiert und heruntergeladen.' });
            } else {
                updateMessage({ download: 'Fehler beim Generieren der Etiketten.' });
            }
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ download: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        } finally {
            setLoading((prev) => ({ ...prev, labels: false }));
        }
    };

    const handleDeleteAllStudents = async () => {
        try {
            const response = await axios.delete('/api/deleteAllStudents');

            if (response.status === 200) {
                updateMessage({ delete: 'Alle Schüler wurden erfolgreich gelöscht.' });
            } else {
                updateMessage({ delete: 'Fehler beim Löschen der Schüler.' });
            }
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ delete: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        } finally {
            confirmDeletePopup.current.close();
        }
    };

    const downloadResults = async (type) => {
        setLoading((prev) => ({ ...prev, downloadResults: true }));
        try {
            const response = await axios.get('/api/exportSpenden', { responseType: 'blob', params: { requestedType: type } });

            if (response.status === 200) {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', type === 'allstudents' ? 'Auswertung_Gesamt.xlsx' : 'Auswertung_Klassen.xlsx');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                updateMessage({ download: 'Fehler beim Herunterladen der Excel-Datei.' });
            }
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ download: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' });
        }
        setLoading((prev) => ({ ...prev, downloadResults: false }));
    };

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
    }; const saveClassStructure = async () => {
        try {
            const response = await axios.put('/api/classStructure', {
                availableClasses: tempClassStructure
            });

            if (response.data.success) {
                setClassStructure(tempClassStructure);
                setSelectedClasses(Object.values(tempClassStructure).flat());
                updateMessage({ upload: 'Klassenstruktur erfolgreich gespeichert.' });
                classStructurePopup.current.close();
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Klassenstruktur:', error);
            updateMessage({ upload: 'Fehler beim Speichern der Klassenstruktur.' });
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Setup</h1>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.subTitle}>Datenbank</h2>
                    <hr className={styles.line} />
                </div>

                <button
                    onClick={() => window.open('/teachers', '_self')}
                    className={styles.button}
                    title="Konfiguriere die E-Mail-Adressen und Klassen der Lehrer."
                >
                    Lehrer Verwaltung
                </button>

                <button
                    onClick={openClassStructurePopup}
                    className={styles.button}
                    title="Konfiguriere die Struktur der Jahrgänge und Klassen."
                >
                    Klassenstruktur verwalten
                </button>

                <button
                    onClick={() => importExcelPopup.current.showModal()}
                    className={styles.button}
                    disabled={loading.upload}
                >
                    Excel-Datei hochladen
                </button>

                <button
                    onClick={() => confirmDeletePopup.current.showModal()}
                    className={styles.redButton}
                >
                    Alle Schüler löschen
                </button>
                {message.delete && <p className={styles.message}>{message.delete}</p>}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.subTitle}>Etiketten</h2>
                    <hr className={styles.line} />
                </div>
                <button
                    onClick={() => generateLabelsPopup.current.showModal()}
                    className={styles.button}
                    disabled={loading.replacement}
                >
                    Etiketten generieren
                </button>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.subTitle}>Auswertungen</h2>
                    <hr className={styles.line} />
                </div>
                <button
                    onClick={() => window.open('/mails', '_self')}
                    className={styles.button}
                    title="Versendet eine E-Mail mit den gelaufenen Runden aller Schüler an die jeweiligen Klassenlehrer."
                >
                    gelaufene Runden per Mail versenden
                </button>
                <button onClick={() => window.open('/donations', '_self')} className={styles.button}>
                    Spenden eintragen
                </button>
                <button onClick={() => exportSpendenPopup.current.showModal()} className={styles.button}>
                    Spenden-Auswertungen downloaden
                </button>
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

            <ImportExcelDialog
                dialogRef={importExcelPopup}
                handleUploadExcel={handleUploadExcel}
                handleFileChange={handleFileChange}
                loading={loading}
                message={message}
                insertedCount={insertedCount}
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