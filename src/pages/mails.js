import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import styles from '../styles/Mails.module.css';

export default function Home() {
    const [fileData, setFileData] = useState({
        file: null,
        email: '',
        password: ''
    });
    const [teacherData, setTeacherData] = useState({
        emails: {},
        files: {}
    });
    const [status, setStatus] = useState({
        message: '',
        loading: false,
        loginMessage: ''
    });
    const [credentialsCorrect, setCredentialsCorrect] = useState(false);
    const sendMailsPopup = useRef(null);

    useEffect(() => {
        const fetchTeacherEmails = async () => {
            const response = await fetch('/api/teachers');
            if (response.ok) {
                const data = await response.json();
                const initialEmails = {};
                Object.keys(data).forEach((className) => {
                    initialEmails[className] = data[className].length ? [...data[className], ''] : [''];
                });
                setTeacherData({ ...teacherData, emails: initialEmails });
            } else {
                console.error('Fehler beim Laden der Lehrer E-Mails');
            }
        };

        fetchTeacherEmails();
    }, []);

    const handleLogin = async () => {
        try {
            const response = await fetch('/api/mail-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: fileData.email,
                    password: fileData.password
                }),
            });
            const data = await response.json();
            if (data.success) {
                setCredentialsCorrect(true);
            }
            setStatus({
                ...status,
                loginMessage: data.success ? 'Login erfolgreich' : 'Login fehlgeschlagen. Überprüfen Sie Ihre Zugangsdaten.'
            });
        } catch (error) {
            setStatus({ ...status, loginMessage: 'Fehler beim Login: ' + error.message });
        }
    };

    const handleFileChange = (e) => {
        setFileData((prev) => ({ ...prev, file: e.target.files[0] }));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!fileData.file) {
            setStatus({ ...status, message: 'Bitte wähle eine ZIP-Datei aus.' });
            return;
        }

        sendMailsPopup.current.close();
        setStatus({ ...status, loading: true });

        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(fileData.file);

            const extractedFiles = {};
            await Promise.all(
                Object.keys(zipContent.files).map(async (filename) => {
                    const fileContent = await zipContent.files[filename].async('base64');
                    extractedFiles[filename] = fileContent;
                })
            );

            for (let key in extractedFiles) {
                if (key.includes('.xlsx')) {
                    let newKey = key.replace('.xlsx', '');
                    extractedFiles[newKey] = extractedFiles[key];
                    delete extractedFiles[key];
                }
            }

            setTeacherData((prev) => ({ ...prev, files: extractedFiles }));
            setStatus({ message: 'Datei erfolgreich verarbeitet!', loading: false });
        } catch (error) {
            setStatus({ message: `Fehler beim Verarbeiten der Datei: ${error.message}`, loading: false });
        }
    };

    const handleEmailChange = (className, index) => (e) => {
        const newEmails = [...teacherData.emails[className]];
        newEmails[index] = e.target.value;

        // Überprüfen, ob das letzte Feld nicht mehr leer ist, um ein weiteres leeres Feld hinzuzufügen
        if (index === newEmails.length - 1 && e.target.value !== '') {
            newEmails.push('');
        }

        // Remove extra empty fields if there is more than one empty field at the end
        if (newEmails.filter(email => email === '').length > 1) {
            while (newEmails[newEmails.length - 1] === '' && newEmails[newEmails.length - 2] === '') {
                newEmails.pop();
            }
        }

        setTeacherData((prev) => ({
            ...prev,
            emails: {
                ...prev.emails,
                [className]: newEmails
            }
        }));
    };

    const handleSendEmails = async () => {
        if (!Object.keys(teacherData.files || {}).length) {
            setStatus({ ...status, message: 'Bitte lade zuerst eine ZIP-Datei hoch.' });
            return;
        }

        setStatus({ ...status, loading: true });
        try {
            const response = await fetch('/api/send-mails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherEmails: teacherData.emails,
                    teacherFiles: teacherData.files,
                    email: fileData.email,
                    password: fileData.password
                })
            });

            const data = await response.json();
            setStatus({ message: data.message, loading: false });
        } catch (error) {
            setStatus({ message: `Fehler beim Senden der E-Mails: ${error.message}`, loading: false });
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>ZIP-Datei hochladen und E-Mails senden</h1>
            <button className={styles.button} onClick={() => sendMailsPopup.current.showModal()}>
                Mail versenden
            </button>

            <dialog ref={sendMailsPopup} className={styles.popup}>
                <div className={styles.popupContent}>
                    <button className={styles.closeButtonX} onClick={() => sendMailsPopup.current.close()}>&times;</button>
                    <h2>Mails mit Tabellen versenden</h2>

                    <label>Datei auswählen:</label>
                    <input type="file" onChange={handleFileChange} accept=".zip" required />

                    <h2>Microsoft Login</h2>
                    <label>E-Mail Adresse:</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="E-Mail Adresse"
                        value={fileData.email}
                        onChange={(e) => setFileData({ ...fileData, email: e.target.value })}
                        disabled={credentialsCorrect}
                        required
                    />
                    <label>Passwort:</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Microsoft Passwort"
                        value={fileData.password}
                        onChange={(e) => setFileData({ ...fileData, password: e.target.value })}
                        disabled={credentialsCorrect}
                        required
                    />
                    <label>Sender-Name:</label>
                    <input type="text" name="senderName" placeholder="Mail Absender-Name" value={"Schülervertretung"} required />

                    <button onClick={handleLogin}>Login</button>
                    {status.loginMessage && <p>{status.loginMessage}</p>}

                    <div className={styles.popupButtons}>
                        <button onClick={() => sendMailsPopup.current.close()} className={styles.buttonDelete}>
                            Abbrechen
                        </button>
                        <button onClick={handleUpload} disabled={!credentialsCorrect}>
                            Weiter
                        </button>
                    </div>
                    {status.loading && <div className={styles.process} />}
                </div>
            </dialog>

            {Object.keys(teacherData.files).length > 0 && (
                <div>
                    <h2 className={styles.subtitle}>Lehrer E-Mails</h2>
                    {Object.keys(teacherData.files).map((className) => (
                        <div key={className} className={styles.classContainer}>
                            <div className={styles.classTitle}>{className}</div>
                            <div className={styles.emailFields}>
                                {teacherData.emails[className]?.map((email, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                                        <span className={styles.emailIndex}>{index + 1}.</span>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={handleEmailChange(className, index)}
                                            placeholder="E-Mail Adresse"
                                            className={styles.inputEmail}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={handleSendEmails}>E-Mails senden</button>
                </div>
            )}

            {status.message && <p className={styles.message}>{status.message}</p>}
        </div>
    );
}
