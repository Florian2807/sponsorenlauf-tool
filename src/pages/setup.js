import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/Setup.module.css';
import axios from 'axios';
import config from '../data/config.json';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState({ download: '', upload: '', replacement: '', delete: '' });
    const [insertedCount, setInsertedCount] = useState(0);
    const [loading, setLoading] = useState({ upload: false, labels: false, replacement: false, downloadResults: false });
    const [replacementAmount, setReplacementAmount] = useState(0);
    const [classes, setClasses] = useState([]);
    const allPossibleClasses = config.availableClasses;
    const [selectedClasses, setSelectedClasses] = useState(Object.values(allPossibleClasses).flat());

    const generateLabelsPopup = useRef(null);
    const confirmDeletePopup = useRef(null);
    const importExcelPopup = useRef(null);
    const exportSpendenPopup = useRef(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await axios.get('/api/getClasses');
                setClasses(response.data);
            } catch (error) {
                console.error('Fehler beim Abrufen der Klassen:', error);
            }
        };
        fetchClasses();
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

            <dialog ref={generateLabelsPopup} className={styles.popup}>
                <button className={styles.closeButtonX} onClick={() => generateLabelsPopup.current.close()}>
                    &times;
                </button>
                <h2>Etiketten generieren</h2>
                <p>Füge Ersatz-IDs hinzu, welche später Schülern zugeordnet werden, welche ihren Zettel verloren haben</p>
                <label>Ersatz-IDs hinzufügen:</label>
                <input
                    type="number"
                    value={replacementAmount}
                    onChange={(e) => setReplacementAmount(e.target.value)}
                    className={styles.input}
                />
                <label>Klassen auswählen:</label>
                <div className={styles.selectButtons}>
                    <button onClick={handleSelectAll} className={styles.selectButton}>Alle auswählen</button>
                    <button onClick={handleDeselectAll} className={styles.selectButton}>Alle abwählen</button>
                </div>
                <div className={styles.classCheckboxes} style={{ color: 'grey' }}
                >
                    <label className={styles.classSelectLabel}>
                        <input
                            type="checkbox"
                            value="Erstatz"
                            checked={replacementAmount > 0}
                            disabled={true}
                            onChange={handleClassSelection}
                        />
                        Ersatz
                    </label>
                    <div className={styles.newLine}></div>

                    {classes.map((klasse, index) => (
                        <React.Fragment key={klasse}>
                            <label className={styles.classSelectLabel}>
                                <input
                                    type="checkbox"
                                    value={klasse}
                                    checked={selectedClasses.includes(klasse)}
                                    onChange={handleClassSelection}
                                />
                                {klasse}
                            </label>
                        </React.Fragment>
                    ))}
                </div>
                {message.download && <p className={styles.message}>{message.download}</p>}
                {loading.labels && <div className={styles.progress} />}
                <div className={styles.popupButtons}>
                    <button
                        onClick={() => generateLabelsPopup.current.close()}
                        className={styles.redButton}
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleGenerateLabels}
                        disabled={loading.labels}
                    >
                        Generieren
                    </button>
                </div>
            </dialog>

            <dialog ref={importExcelPopup} className={styles.popup}>
                <button className={styles.closeButtonX} onClick={() => importExcelPopup.current.close()}>&times;</button>
                <h2>Excel-Datei hochladen</h2>
                <p>Die ersten drei Spalten der Excel-Tabelle sind Vorname, Nachname und Klasse</p>
                <p>Die erste Zeile ist für Überschriften reserviert</p>
                <form onSubmit={handleUploadExcel} className={styles.uploadForm}>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".xlsx"
                        required
                        className={styles.fileInput}
                    />
                    <button type="submit" className={styles.button} disabled={loading.upload}>
                        Hochladen
                    </button>
                    <br />
                    {loading.upload && <div className={styles.progress} />}
                </form>
                {message.upload && <p className={styles.message}>{message.upload}</p>}
                {insertedCount > 0 && <p className={styles.message}>Eingefügte Datensätze: {insertedCount}</p>}
            </dialog>

            <dialog ref={exportSpendenPopup} className={styles.popup}>
                <button className={styles.closeButtonX} onClick={() => exportSpendenPopup.current.close()}>&times;</button>
                <h2>Spenden Auswertungen downloaden</h2>
                <div className={styles.popupButtons}>
                    <button onClick={() => downloadResults('allstudents')} className={styles.button} disabled={loading.downloadResults}>
                        Gesamtauswertung
                    </button>
                    <button className={styles.button} onClick={() => downloadResults('classes')} disabled={loading.downloadResults}>
                        Klassenweise Auswertung
                    </button>
                </div>
                {loading.downloadResults && <div className={styles.progress} />}
            </dialog >

            <dialog ref={confirmDeletePopup} className={styles.popup}>
                <button className={styles.closeButtonX} onClick={() => confirmDeletePopup.current.close()}>
                    &times;
                </button>
                <h2>Bestätigen Sie das Löschen</h2>
                <p>Möchten Sie wirklich alle Schüler löschen?</p>
                <div className={styles.popupButtons}>
                    <button
                        onClick={() => confirmDeletePopup.current.close()}
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleDeleteAllStudents}
                        className={styles.redButton}
                    >
                        Alle löschen
                    </button>
                </div>
            </dialog>
        </div >
    );
}