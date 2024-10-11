import { useState } from 'react';
import styles from '../styles/Setup.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [downloadMessage, setDownloadMessage] = useState('');
    const [uploadMessage, setUploadMessage] = useState('');
    const [insertedCount, setInsertedCount] = useState(0);
    const [loading, setLoading] = useState({ upload: false, labels: false });


    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setInsertedCount(0);
        setDownloadMessage('');
        setUploadMessage('');
    };

    const handleUploadExcel = async (e) => {
        e.preventDefault();
        if (!file) {
            setDownloadMessage('');
            setUploadMessage('Bitte wählen Sie eine Excel-Datei aus.');
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
                setDownloadMessage('');
                setUploadMessage(`Fehler beim Importieren der Excel-Datei: ${errorData.message}`);
                setLoading((prev) => ({ ...prev, upload: false }));
                return;
            }

            const responseData = await importResponse.json();
            setInsertedCount(responseData.count);
            setDownloadMessage('');
            setUploadMessage('Excel-Datei erfolgreich hochgeladen und Daten in die Datenbank eingefügt.');
        } catch (error) {
            console.error('Fehler:', error);
            setDownloadMessage('');
            setUploadMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading((prev) => ({ ...prev, upload: false }));
        }
    };

    const addReplacements = () => {
        const amount = 1
        const replacementResponse = axios.post('/api/addReplacements', { amount });

        if (!replacementResponse.ok) {
            console.error('Fehler beim Hinzufügen der Vertretungen.');
            return;
        }
    }


    const handleGenerateLabels = async () => {
        setLoading((prev) => ({ ...prev, labels: true }));
        setUploadMessage('');
        setInsertedCount(0);
        setDownloadMessage('Etiketten werden generiert...');

        try {
            const labelResponse = await fetch('/api/generate-labels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!labelResponse.ok) {
                const errorData = await labelResponse.json();
                setUploadMessage('');
                setDownloadMessage(`Fehler beim Generieren der Etiketten: ${errorData.message}`);
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
            
            setUploadMessage('');
            setDownloadMessage('Etiketten erfolgreich generiert und heruntergeladen.');
        } catch (error) {
            console.error('Fehler:', error);
            setUploadMessage('');
            setDownloadMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading((prev) => ({ ...prev, labels: false }));
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

                    {uploadMessage && <p className={styles.message}>{uploadMessage}</p>}

                    {insertedCount > 0 && <p className={styles.message}>Eingefügte Datensätze: {insertedCount}</p>}

                    <button onClick={addReplacements} className={styles.button} disabled={loading.labels}>
                        Etiketten downloaden
                    </button>
                    <br />
                    {loading.labels && <div className={styles.progress} />}
                </>
            {downloadMessage && <p className={styles.message}>{downloadMessage}</p>}
        </div>
    );
}
