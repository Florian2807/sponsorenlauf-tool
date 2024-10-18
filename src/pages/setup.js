import { useState } from 'react';
import styles from '../styles/Setup.module.css';
import axios from 'axios';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState({ download: '', upload: '', replacement: '', delete: '' });
    const [insertedCount, setInsertedCount] = useState(0);
    const [loading, setLoading] = useState({ upload: false, labels: false, replacements: false });
    const [showPopup, setShowPopup] = useState(false);
    const [showConfirmDeletePopup, setShowConfirmDeletePopup] = useState(false); // State für das Bestätigungs-Popup
    const [replacementData, setReplacementData] = useState({
        className: '',
        firstName: '',
        lastName: '',
        amount: 1
    });

    const updateMessage = (update = {}) => {
        const tmp = {}
        Object.keys(message).forEach(event => {
            if (Object.keys(update).includes(event)) {
                tmp[event] = update[event]
            } else {
                tmp[event] = ''
            }
            setMessage(tmp)
        });
    }

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
                updateMessage({ upload: `Fehler beim Importieren der Excel-Datei: ${errorData.message}` })
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

    const handlePopupSubmit = async () => {
        setLoading((prev) => ({ ...prev, replacements: true }));
        updateMessage()

        setShowPopup(false);
        try {
            const replacementResponse = await axios.post('/api/addReplacements', replacementData);
            console.log(replacementData)
            if (replacementResponse.status !== 200) {
                updateMessage({ replacement: 'Fehler beim Hinzufügen der Ersatz-Benutzer.' })
            } else {
                updateMessage({ replacement: `Erfolgreich ${replacementData.amount} Ersatz-Benutzer hinzugefügt.` })
            }
        } catch (error) {
            updateMessage({ replacement: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' })
        } finally {
            setLoading((prev) => ({ ...prev, replacements: false }));
        }
    };

    const handleGenerateLabels = async () => {
        setLoading((prev) => ({ ...prev, labels: true }));
        setInsertedCount(0);
        updateMessage({ download: 'Etiketten werden generiert...' })

        try {
            const labelResponse = await fetch('/api/generate-labels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!labelResponse.ok) {
                const errorData = await labelResponse.json();
                updateMessage({ download: `Fehler beim Generieren der Etiketten: ${errorData.message}` })
                setLoading((prev) => ({ ...prev, labels: false }));
                return;
            }

            const labelBlob = await labelResponse.blob();
            const labelUrl = URL.createObjectURL(labelBlob);

            const a = document.createElement('a');
            a.href = labelUrl;
            a.download = 'labels.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            updateMessage({ download: 'Etiketten erfolgreich generiert und heruntergeladen.' })
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ download: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' })
        } finally {
            setLoading((prev) => ({ ...prev, labels: false }));
        }
    };

    // Neue Funktion zum Löschen aller Schüler
    const handleDeleteAllStudents = async () => {
        try {
            const response = await axios.delete('/api/deleteStudents');

            if (response.status === 200) {
                updateMessage({ delete: 'Alle Schüler wurden erfolgreich gelöscht.' })
            } else {
                updateMessage({ delete: 'Fehler beim Löschen der Schüler.' })
            }
        } catch (error) {
            console.error('Fehler:', error);
            updateMessage({ delete: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' })
        } finally {
            setShowConfirmDeletePopup(false); // Schließe das Bestätigungs-Popup
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Setup</h1>
            <>
                <form onSubmit={handleUploadExcel} className={styles.uploadForm}>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".xlsx"
                        required
                        className={styles.fileInput}
                    />
                    <button type="submit" className={styles.button} disabled={loading.upload}>
                        Excel-Datei hochladen
                    </button>
                    <br />
                    {loading.upload && <div className={styles.progress} />}
                </form>

                {message.upload && <p className={styles.message}>{message.upload}</p>}
                {insertedCount > 0 && <p className={styles.message}>Eingefügte Datensätze: {insertedCount}</p>}

                <button
                    onClick={() => setShowPopup(true)} // Öffne Popup
                    className={styles.button}
                    disabled={loading.replacements}
                >
                    Ersatz-Benutzer hinzufügen
                </button>


                <button
                    onClick={() => setShowConfirmDeletePopup(true)}
                    className={styles.buttonDelete}
                >
                    Alle Schüler löschen
                </button>
            </>
            <br />
            {loading.replacements && <div className={styles.progress} />}
            {message.replacement && <p className={styles.message}>{message.replacement}</p>}

            {message.download && <p className={styles.message}>{message.download}</p>}
            {message.delete && <p className={styles.message}>{message.delete}</p>}

            <button onClick={handleGenerateLabels} className={styles.button} disabled={loading.labels}>
                Etiketten downloaden
            </button>
            <br />
            {loading.labels && <div className={styles.progress} />}

            {showPopup && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <button className={styles.closeButton} onClick={() => setShowPopup(false)}>
                            &times;
                        </button>

                        <h2>Ersatz-Benutzer hinzufügen</h2>
                        <label>
                            Klasse:
                            <input
                                type="text"
                                value={replacementData.className}
                                onChange={(e) =>
                                    setReplacementData({ ...replacementData, className: e.target.value })
                                }
                                className={styles.input}
                            />
                        </label>
                        <label>
                            Vorname:
                            <input
                                type="text"
                                value={replacementData.firstName}
                                onChange={(e) =>
                                    setReplacementData({ ...replacementData, firstName: e.target.value })
                                }
                                className={styles.input}
                            />
                        </label>
                        <label>
                            Nachname:
                            <input
                                type="text"
                                value={replacementData.lastName}
                                onChange={(e) =>
                                    setReplacementData({ ...replacementData, lastName: e.target.value })
                                }
                                className={styles.input}
                            />
                        </label>
                        <label>
                            Anzahl:
                            <input
                                type="number"
                                min="1"
                                value={replacementData.amount}
                                onChange={(e) =>
                                    setReplacementData({ ...replacementData, amount: e.target.value })
                                }
                                className={styles.input}
                            />
                        </label>
                        <div className={styles.buttonGroup}>
                            <button
                                onClick={() => setShowPopup(false)}
                                className={styles.buttonCancel}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handlePopupSubmit}
                                className={styles.button}
                            >
                                Hinzufügen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bestätigungs-Popup zum Löschen */}
            {showConfirmDeletePopup && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <button className={styles.closeButton} onClick={() => setShowConfirmDeletePopup(false)}>
                            &times;
                        </button>
                        <h2>Bestätigen Sie das Löschen</h2>
                        <p>Möchten Sie wirklich alle Schüler löschen?</p>
                        <div className={styles.buttonGroup}>
                            <button
                                onClick={() => setShowConfirmDeletePopup(false)}
                                className={styles.buttonCancelDelete}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleDeleteAllStudents}
                                className={styles.buttonDelete}
                            >
                                Alle löschen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
