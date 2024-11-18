import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import styles from '../styles/Mails.module.css';

export default function Home() {
    const [fileData, setFileData] = useState({
        file: null,
        email: '',
        password: '',
        senderName: 'Schülervertretung',
        mailText: `Sehr geehrte Lehrkraft,\n\nanbei finden Sie die Liste der Schülerinnen und Schüler Ihrer Klasse für den Sponsorenlauf ${new Date().getFullYear()}.\n\nSchüler, die mehrmals in dieser Liste stehen, sollten die Runden bitte addiert werden, da diese eine Ersatzkarte erhalten haben.\n\nMit freundlichen Grüßen,\n\nIhr SV-Team\n`
    });
    const [teacherData, setTeacherData] = useState({
        emails: {},
        files: {}
    });
    const [status, setStatus] = useState({
        message: '',
        loginLoading: false,
        uploadLoading: false,
        sendMailLoading: false,
        loginMessage: ''
    });
    const [credentialsCorrect, setCredentialsCorrect] = useState(false);
    const sendMailsPopup = useRef(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadMode, setUploadMode] = useState('api');

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
            setStatus({ ...status, loginLoading: true });
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
                loginLoading: false,
                loginMessage: data.success ? 'Login erfolgreich' : 'Login fehlgeschlagen. Überprüfen Sie Ihre Zugangsdaten.'
            });
        } catch (error) {
            setStatus({ ...status, loginLoading: false, loginMessage: 'Fehler beim Login: ' + error.message });
        }
    };

    const handleFileChange = (e) => {
        setFileData((prev) => ({ ...prev, file: e.target.files[0] }));
        setUploadMode('file');
    };

    const fetchFileFromApi = async () => {
        try {
            const response = await fetch('/api/exportExcel');
            if (response.ok) {
                setUploadMode('api');
                return await response.blob();
            } else {
                setStatus({ message: 'Fehler beim Abrufen der Datei von der API', uploadLoading: false });
            }
        } catch (error) {
            setStatus({ message: `API Fehler: ${error.message}`, uploadLoading: false });
        }
        return null;
    };

    const handleUpload = async (e) => {
        e.preventDefault(); // Prevent form submission default behavior
        setStatus({ ...status, uploadLoading: true });

        const zipFile = uploadedFile || (await fetchFileFromApi());

        if (!zipFile) {
            setStatus({ message: 'Bitte wähle eine ZIP-Datei aus.', uploadLoading: false });
            return;
        }

        try {
            // Use JSZip to process the ZIP file
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(zipFile);
            const extractedFiles = {};

            // Extract files from the ZIP
            await Promise.all(
                Object.keys(zipContent.files).map(async (filename) => {
                    const fileContent = await zipContent.files[filename].async('base64');
                    extractedFiles[filename.replace('.xlsx', '')] = fileContent;
                })
            );

            // Update teacherData state with extracted files
            setTeacherData((prev) => ({ ...prev, files: extractedFiles }));
            setStatus({ message: 'Datei erfolgreich verarbeitet!', uploadLoading: false });
            sendMailsPopup.current.close()
        } catch (error) {
            setStatus({ message: `Fehler beim Verarbeiten der Datei: ${error.message}`, uploadLoading: false });
        }
    };

    const handleEmailChange = (className, index) => (e) => {
        const newEmails = [...teacherData.emails[className]];
        newEmails[index] = e.target.value;

        if (index === newEmails.length - 1 && e.target.value !== '') {
            newEmails.push('');
        }
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

        setStatus({ ...status, sendMailLoading: true });
        try {
            Object.keys(teacherData.emails).forEach((className) => {
                teacherData.emails[className] = teacherData.emails[className].filter((email) => email !== '');
            });

            const response = await fetch('/api/send-mails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherEmails: teacherData.emails,
                    teacherFiles: teacherData.files,
                    mailText: fileData.mailText,
                    email: fileData.email,
                    password: fileData.password,
                    senderName: fileData.senderName
                })
            });

            const data = await response.json();
            setStatus({ message: data.message, sendMailLoading: false });
        } catch (error) {
            setStatus({ message: `Fehler beim Senden der E-Mails: ${error.message}`, sendMailLoading: false });
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>ZIP-Datei hochladen und E-Mails senden</h1>
            {!Object.keys(teacherData.files).length &&
                <button className={styles.button} onClick={() => sendMailsPopup.current.showModal()}>
                    Mail versenden
                </button>
            }

            <dialog ref={sendMailsPopup} className={styles.popup}>
                <div className={styles.popupContent}>
                    <button className={styles.closeButtonX} onClick={() => sendMailsPopup.current.close()}>&times;</button>
                    <h2>Mails mit Tabellen versenden</h2>

                    <label>Datei auswählen:</label>
                    <input
                        type="file"
                        accept=".zip"
                        onChange={(e) => {
                            handleFileChange(e);
                            setUploadedFile(e.target.files[0]);
                        }}
                    />
                    {uploadMode === 'file' && <p className={styles.indicator}>Modus: Datei hochgeladen</p>}
                    {uploadMode === 'api' && <p className={styles.indicator}>Modus: API verwendet</p>}

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
                    <input
                        type="text"
                        name="senderName"
                        placeholder="Mail Absender-Name"
                        value={fileData.senderName}
                        onChange={(e) => setFileData({ ...fileData, senderName: e.target.value })}
                        required
                    />

                    <button onClick={handleLogin}>Login</button>
                    <br />
                    {status.loginLoading && <div className={styles.progress} />}
                    {status.loginMessage && <p>{status.loginMessage}</p>}

                    <div className={styles.popupButtons}>
                        <button onClick={() => sendMailsPopup.current.close()} className={`${styles.button} ${styles.redButton}`}>
                            Abbrechen
                        </button>
                        <button
                            onClick={handleUpload} disabled={!credentialsCorrect}>
                            Weiter
                        </button>
                    </div>
                    {status.uploadLoading && <div className={styles.progress} />}
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
                    <h2>Mail-Inhalt</h2>
                    <textarea
                        value={fileData.mailText}
                        onChange={(e) => setFileData({ ...fileData, mailText: e.target.value })}
                        className={styles.textarea}
                    />
                    <br />
                    <button onClick={handleSendEmails} className={styles.button}>E-Mails senden</button>
                </div>
            )}

            {status.sendMailLoading && <div className={styles.progress} />}
            {status.message && <p className={styles.message}>{status.message}</p>}
        </div>
    );
}