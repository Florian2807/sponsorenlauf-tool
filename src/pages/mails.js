import { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import styles from '../styles/Mails.module.css';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import SendMailsDialog from '../components/dialogs/mails/SendMailsDialog';

export default function Home() {
    const [fileData, setFileData] = useState({
        file: null,
        email: '',
        password: '',
        senderName: 'Schülervertretung',
        mailText: `Sehr geehrte Lehrkraft,\n\nanbei finden Sie die Liste der Schülerinnen und Schüler Ihrer Klasse für den Sponsorenlauf ${new Date().getFullYear()}.\n\nSchüler, die mehrmals in dieser Liste stehen, sollten die Runden bitte addiert werden, da diese eine Ersatzkarte erhalten haben.\n\nMit freundlichen Grüßen,\n\nIhr SV-Team\n`
    });
    const [teacherData, setTeacherData] = useState({
        files: {},
        allTeachers: [],
        classTeacher: {}
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

    useEffect(() => {
        const fetchAllTeachers = async () => {
            try {
                const response = await fetch('/api/getAllTeachers');
                if (response.ok) {
                    const data = await response.json();
                    const classTeacher = {};

                    data.forEach((teacher) => {
                        if (!teacher.klasse) return;
                        if (!classTeacher[teacher.klasse]) {
                            classTeacher[teacher.klasse] = [];
                        }
                        classTeacher[teacher.klasse].push({ id: teacher.id, name: `${teacher.nachname}, ${teacher.vorname}`, email: teacher.email });
                    });

                    Object.keys(classTeacher).forEach((className) => {
                        if (classTeacher[className].length < 2) {
                            classTeacher[className].push({ id: null, name: null, email: '' });
                        }
                    });

                    setTeacherData((prev) => ({ ...prev, allTeachers: data, classTeacher }));
                } else {
                    console.error('Fehler beim Laden aller Lehrer');
                }
            } catch (error) {
                console.error('Fehler beim Laden aller Lehrer:', error);
            }
        };

        fetchAllTeachers();
    }, []);

    const handleLogin = async () => {
        try {
            setStatus((prev) => ({ ...prev, loginLoading: true }));
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
            setStatus((prev) => ({
                ...prev,
                loginLoading: false,
                loginMessage: data.success ? 'Login erfolgreich' : 'Login fehlgeschlagen. Überprüfen Sie Ihre Zugangsdaten.'
            }));
        } catch (error) {
            setStatus((prev) => ({ ...prev, loginLoading: false, loginMessage: 'Fehler beim Login: ' + error.message }));
        }
    };

    const fetchFileFromApi = async () => {
        try {
            const response = await fetch('/api/exportExcel');
            if (response.ok) {
                return await response.blob();
            } else {
                setStatus((prev) => ({ ...prev, message: 'Fehler beim Abrufen der Datei von der API', uploadLoading: false }));
            }
        } catch (error) {
            setStatus((prev) => ({ ...prev, message: `API Fehler: ${error.message}`, uploadLoading: false }));
        }
        return null;
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setStatus((prev) => ({ ...prev, uploadLoading: true }));

        const zipFile = await fetchFileFromApi();

        if (!zipFile) {
            setStatus((prev) => ({ ...prev, message: 'Bitte wähle eine ZIP-Datei aus.', uploadLoading: false }));
            return;
        }

        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(zipFile);
            const extractedFiles = {};

            await Promise.all(
                Object.keys(zipContent.files).map(async (filename) => {
                    const fileContent = await zipContent.files[filename].async('base64');
                    extractedFiles[filename.replace('.xlsx', '')] = fileContent;
                })
            );

            setTeacherData((prev) => ({ ...prev, files: extractedFiles }));
            setStatus((prev) => ({ ...prev, message: 'Datei erfolgreich verarbeitet!', uploadLoading: false }));
            sendMailsPopup.current.close();
        } catch (error) {
            setStatus((prev) => ({ ...prev, message: `Fehler beim Verarbeiten der Datei: ${error.message}`, uploadLoading: false }));
        }
    };

    const handleTeacherChange = (className, index) => (e) => {
        const newId = parseInt(e.target.value);
        const newT = [...teacherData.classTeacher[className]];

        if (!newId) {
            newT[index] = { id: null, name: null, email: '' };
            setTeacherData({ ...teacherData, classTeacher: { ...teacherData.classTeacher, [className]: newT } });
            return;
        }

        const foundTeacher = teacherData.allTeachers.find((teacher) => teacher.id === newId);
        newT[index] = { id: newId, name: `${foundTeacher.nachname}, ${foundTeacher.vorname}`, email: foundTeacher.email };

        if (!newT.some((teacher) => teacher.id === null)) {
            newT.push({ id: null, name: null, email: '' });
        }

        while (newT.filter(t => t.id === null).length > 1) {
            const indexToRemove = newT.findIndex(t => t.id === null);
            newT.splice(indexToRemove, 1);
        }

        setTeacherData({ ...teacherData, classTeacher: { ...teacherData.classTeacher, [className]: newT } });
    };

    const handleSendEmails = async () => {
        if (!Object.keys(teacherData.files || {}).length) {
            setStatus((prev) => ({ ...prev, message: 'Bitte lade zuerst eine ZIP-Datei hoch.' }));
            return;
        }

        setStatus((prev) => ({ ...prev, sendMailLoading: true }));
        try {
            const filteredClassTeacher = {};
            Object.keys(teacherData.classTeacher).forEach((className) => {
                filteredClassTeacher[className] = teacherData.classTeacher[className].filter((teacher) => teacher.id);
            });

            const response = await fetch('/api/send-mails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherEmails: filteredClassTeacher,
                    teacherFiles: teacherData.files,
                    mailText: fileData.mailText,
                    email: fileData.email,
                    password: fileData.password,
                    senderName: fileData.senderName
                })
            });

            const data = await response.json();
            setStatus((prev) => ({ ...prev, message: data.message, sendMailLoading: false }));
        } catch (error) {
            setStatus((prev) => ({ ...prev, message: `Fehler beim Senden der E-Mails: ${error.message}`, sendMailLoading: false }));
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Mails versenden</h1>
            <p className={styles.description}>
                Hier werden die Klassenlisten mit gelaufenen Rundern der Schüler generiert und an die jeweiligen Klassenlehrer versendet.
            </p>
            <br />
            {!Object.keys(teacherData.files).length && (
                <button className={styles.button} onClick={() => sendMailsPopup.current.showModal()}>
                    Mail versenden
                </button>
            )}

            <SendMailsDialog
                dialogRef={sendMailsPopup}
                fileData={fileData}
                setFileData={setFileData}
                credentialsCorrect={credentialsCorrect}
                handleLogin={handleLogin}
                status={status}
                handleUpload={handleUpload}
            />

            {Object.keys(teacherData.files).length > 0 && (
                <div>
                    <h2 className={styles.subtitle}>Lehrer E-Mails</h2>
                    {Object.keys(teacherData.classTeacher).map((className) => (
                        <div key={className} className={styles.classContainer}>
                            <div className={styles.classTitle}>{className}</div>
                            <div className={styles.emailFields}>
                                {teacherData.classTeacher[className]?.map((teacher, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                                        <span className={styles.emailIndex}>{index + 1}.</span>
                                        <select
                                            value={teacher.id || ''}
                                            onChange={handleTeacherChange(className, index)}
                                            className={styles.select}
                                        >
                                            <option value="">Wählen Sie einen Lehrer</option>
                                            {teacherData.allTeachers.map((teacherOption) => (
                                                <option key={teacherOption.id} value={teacherOption.id}>
                                                    {teacherOption.vorname} {teacherOption.nachname}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <h2>Mail-Inhalt</h2>
                    <textarea
                        value={fileData.mailText}
                        onChange={(e) => setFileData((prev) => ({ ...prev, mailText: e.target.value }))}
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