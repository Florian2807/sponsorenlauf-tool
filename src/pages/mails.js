import { useState, useEffect } from 'react';
import styles from '../styles/Mails.module.css';

export default function Home() {
    const [file, setFile] = useState(null);
    const [teacherEmails, setTeacherEmails] = useState({});
    const [teacherFiles, setTeacherFiles] = useState({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchTeacherEmails = async () => {
            const response = await fetch('/api/teachers');
            if (response.ok) {
                const data = await response.json();
                setTeacherEmails(data);
                console.log(teacherEmails);
            } else {
                console.error('Fehler beim Laden der Lehrer E-Mails');
            }
        };

        fetchTeacherEmails();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Bitte wähle eine ZIP-Datei aus.');
            return;
        }

        const formData = new FormData();
        formData.append('zipfile', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            setMessage(`Fehler: ${errorData.message}`);
            return;
        }

        const data = await response.json();
        setTeacherFiles(data.teacherFiles);
        setMessage(data.message);
    };

    const handleEmailChange = (className) => (e) => {
        setTeacherEmails({
            ...teacherEmails,
            [className]: e.target.value.split(',').map((email) => email.trim()),
        });
    };

    const handleSendEmails = async () => {
        if (Object.keys(teacherFiles).length === 0) {
            setMessage('Bitte lade zuerst eine ZIP-Datei hoch.');
            return;
        }

        const response = await fetch('/api/send-mails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teacherEmails, teacherFiles }),
        });

        const data = await response.json();
        setMessage(data.message);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>ZIP-Datei hochladen und E-Mails senden</h1>

            <form onSubmit={handleUpload} className={styles.form}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".zip"
                    required
                    className={styles.inputFile}
                />
                <button type="submit" className={styles.button}>Hochladen</button>
            </form>

            {Object.keys(teacherFiles).length > 0 && (
                <div>
                    <h2 className={styles.subtitle}>Lehrer E-Mails</h2>
                    {Object.keys(teacherFiles).map((className) => (
                        <div key={className}>
                            <label className={styles.label}>{className}: </label>
                            <input
                                type="email"
                                placeholder="E-Mail-Adresse"
                                value={teacherEmails[className] || ''}
                                onChange={handleEmailChange(className)}
                                className={styles.inputEmail}
                            />
                        </div>
                    ))}
                    <button onClick={handleSendEmails} className={styles.button}>E-Mails senden</button>
                </div>
            )}

            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
}
