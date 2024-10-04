import { useState } from 'react';
import styles from '../styles/Setup.module.css';

export default function Setup() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [insertedCount, setInsertedCount] = useState(0);
    const [loading, setLoading] = useState({ upload: false, labels: false });

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setInsertedCount(0);
        setMessage('');
    };

    const handleUploadExcel = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Bitte wählen Sie eine Excel-Datei aus.');
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
                setMessage(`Fehler beim Importieren der Excel-Datei: ${errorData.message}`);
                setLoading((prev) => ({ ...prev, upload: false }));
                return;
            }

            const responseData = await importResponse.json();
            setInsertedCount(responseData.count);
            setMessage('Excel-Datei erfolgreich hochgeladen und Daten in die Datenbank eingefügt.');
        } catch (error) {
            console.error('Fehler:', error);
            setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading((prev) => ({ ...prev, upload: false }));
        }
    };

    const handleGenerateLabels = async () => {
        setLoading((prev) => ({ ...prev, labels: true }));
        setMessage('Etiketten werden generiert...');

        try {
            const labelResponse = await fetch('/api/generate-labels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!labelResponse.ok) {
                const errorData = await labelResponse.json();
                setMessage(`Fehler beim Generieren der Etiketten: ${errorData.message}`);
                setLoading((prev) => ({ ...prev, labels: false }));
                return;
            }

            const labelBlob = await labelResponse.blob();
            const labelUrl = URL.createObjectURL(labelBlob);

            // Automatischer Download der generierten PDF
            const a = document.createElement('a');
            a.href = labelUrl;
            a.download = 'etiketten.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setMessage('Etiketten erfolgreich generiert und heruntergeladen.');
        } catch (error) {
            console.error('Fehler:', error);
            setMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        } finally {
            setLoading((prev) => ({ ...prev, labels: false }));
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Setup: Excel-Datei hochladen und Etiketten generieren</h1>

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

            {message && <p className={styles.message}>{message}</p>}

            {insertedCount > 0 && <p className={styles.message}>Eingefügte Datensätze: {insertedCount}</p>}

            <button onClick={handleGenerateLabels} className={styles.button} disabled={loading.labels}>
                Etiketten downloaden
            </button>
            <br />
            {loading.labels && <div className={styles.progress} />}
            </div>
    );
}
