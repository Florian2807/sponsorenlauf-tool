import { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
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
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const sendMailsPopup = useRef(null);

    useEffect(() => {
        const fetchAllTeachers = async () => {
            try {
                const data = await request('/api/getAllTeachers');
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
            } catch (error) {
                showError(error, 'Beim Laden aller Lehrer');
            }
        };

        fetchAllTeachers();
    }, [request, showError]);

    const handleLogin = async () => {
        try {
            setStatus((prev) => ({ ...prev, loginLoading: true }));
            const data = await request('/api/mail-auth', {
                method: 'POST',
                data: {
                    email: fileData.email,
                    password: fileData.password
                },
                errorContext: 'Beim Login'
            });

            if (data.success) {
                setCredentialsCorrect(true);
                showSuccess('Login erfolgreich', 'E-Mail-Authentifizierung');
            }
            setStatus((prev) => ({
                ...prev,
                loginLoading: false,
                loginMessage: data.success ? 'Login erfolgreich' : 'Login fehlgeschlagen'
            }));
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            setStatus((prev) => ({
                ...prev,
                loginLoading: false,
                loginMessage: 'Fehler beim Login'
            }));
        }
    };

    const fetchFileFromApi = async () => {
        try {
            const response = await request('/api/exportExcel', {
                responseType: 'blob',
                errorContext: 'Beim Abrufen der Datei von der API'
            });
            return response;
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            setStatus((prev) => ({ ...prev, message: 'Fehler beim Abrufen der Datei', uploadLoading: false }));
            return null;
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setStatus((prev) => ({ ...prev, uploadLoading: true }));

        const zipFile = await fetchFileFromApi();

        if (!zipFile) {
            showError('Bitte wähle eine ZIP-Datei aus.', 'Datei-Upload');
            setStatus((prev) => ({ ...prev, uploadLoading: false }));
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
            showSuccess('Datei erfolgreich verarbeitet!', 'Datei-Upload');
            setStatus((prev) => ({ ...prev, uploadLoading: false }));
            sendMailsPopup.current.close();
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            setStatus((prev) => ({ ...prev, uploadLoading: false }));
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
            showError('Bitte lade zuerst eine ZIP-Datei hoch.', 'E-Mail-Versand');
            return;
        }

        setStatus((prev) => ({ ...prev, sendMailLoading: true }));
        try {
            const filteredClassTeacher = {};
            Object.keys(teacherData.classTeacher).forEach((className) => {
                filteredClassTeacher[className] = teacherData.classTeacher[className].filter((teacher) => teacher.id);
            });

            const data = await request('/api/send-mails', {
                method: 'POST',
                data: {
                    teacherEmails: filteredClassTeacher,
                    teacherFiles: teacherData.files,
                    mailText: fileData.mailText,
                    email: fileData.email,
                    password: fileData.password,
                    senderName: fileData.senderName
                },
                errorContext: 'Beim Senden der E-Mails'
            });

            showSuccess(data.message, 'E-Mail-Versand');
            setStatus((prev) => ({ ...prev, sendMailLoading: false }));
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            setStatus((prev) => ({ ...prev, sendMailLoading: false }));
        }
    };

    return (
        <div className="page-container-wide">
            <h1 className="page-title">Mails versenden</h1>
            <p className="text-center text-muted mb-3">
                Hier werden die Klassenlisten mit gelaufenen Rundern der Schüler generiert und an die jeweiligen Klassenlehrer versendet.
            </p>
            {!Object.keys(teacherData.files).length && (
                <div className="text-center">
                    <button className="btn btn-primary btn-lg" onClick={() => sendMailsPopup.current.showModal()}>
                        Mail versenden
                    </button>
                </div>
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
                <div className="section">
                    <h2 className="section-title">Lehrer E-Mails</h2>
                    {Object.keys(teacherData.classTeacher).map((className) => (
                        <div key={className} className="class-container">
                            <div className="class-title">{className}</div>
                            <div className="email-fields">
                                {teacherData.classTeacher[className]?.map((teacher, index) => (
                                    <div key={index} className="d-flex align-center gap-2 mb-2">
                                        <span className="email-index">{index + 1}.</span>
                                        <select
                                            value={teacher.id || ''}
                                            onChange={handleTeacherChange(className, index)}
                                            className="form-select"
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
                    <h2 className="section-title mt-4">Mail-Inhalt</h2>
                    <div className="form-group">
                        <textarea
                            value={fileData.mailText}
                            onChange={(e) => setFileData((prev) => ({ ...prev, mailText: e.target.value }))}
                            className="form-textarea"
                            rows="10"
                        />
                    </div>
                    <div className="form-actions">
                        <button onClick={handleSendEmails} className="btn btn-success" disabled={status.sendMailLoading}>
                            {status.sendMailLoading ? 'E-Mails werden gesendet...' : 'E-Mails senden'}
                        </button>
                    </div>
                </div>
            )}

            {status.sendMailLoading && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>E-Mails werden gesendet...</p>
                </div>
            )}
        </div>
    );
}