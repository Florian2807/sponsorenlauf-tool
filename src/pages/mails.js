import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import SendMailsDialog from '../components/dialogs/mails/SendMailsDialog';
import MailTemplateSelector from '../components/dialogs/mails/MailTemplateSelector';

export default function MailsPage() {
    const { config } = useModuleConfig();

    const [fileData, setFileData] = useState({
        file: null,
        email: '',
        password: '',
        senderName: 'Schülervertretung',
        emailProvider: 'outlook',
        mailText: `Sehr geehrte Lehrkraft,

anbei finden Sie die Liste der Schülerinnen und Schüler Ihrer Klasse für den Sponsorenlauf ${new Date().getFullYear()}.

Schüler, die mehrmals in dieser Liste stehen, sollten die Runden bitte addiert werden, da diese eine Ersatzkarte erhalten haben.

Mit freundlichen Grüßen,

Ihr SV-Team`
    });

    const [teacherData, setTeacherData] = useState({
        files: {},
        allTeachers: [],
        classTeacher: {}
    });

    // State für manuelle E-Mail-Eingabe (wenn Lehrer-Modul deaktiviert ist)
    const [manualEmails, setManualEmails] = useState({});
    const [emailInputMode, setEmailInputMode] = useState('teachers'); // 'teachers' or 'manual'

    const [status, setStatus] = useState({
        message: '',
        loginLoading: false,
        uploadLoading: false,
        sendMailLoading: false,
        sendProgress: 0,
        loginMessage: ''
    });

    const [credentialsCorrect, setCredentialsCorrect] = useState(false);
    const [mailTemplates] = useState([
        {
            name: 'Standard',
            content: `Sehr geehrte Lehrkraft,

anbei finden Sie die Liste der Schülerinnen und Schüler Ihrer Klasse für den Sponsorenlauf ${new Date().getFullYear()}.

Schüler, die mehrmals in dieser Liste stehen, sollten die Runden bitte addiert werden, da diese eine Ersatzkarte erhalten haben.

Mit freundlichen Grüßen,

Ihr SV-Team`
        },
        {
            name: 'Freundlich',
            content: `Liebe Klassenlehrerin, lieber Klassenlehrer,

wir hoffen, es geht Ihnen gut! Anbei senden wir Ihnen die Ergebnisliste Ihrer Klasse vom Sponsorenlauf ${new Date().getFullYear()}.

📊 Bitte beachten Sie: Schüler*innen, die mehrfach aufgeführt sind, haben eine Ersatzkarte erhalten. Die Runden sollten in diesem Fall addiert werden.

Vielen Dank für Ihre Unterstützung!

Herzliche Grüße
Das SV-Team`
        },
        {
            name: 'Kurz & Knapp',
            content: `Hallo,

anbei die Sponsorenlauf-Ergebnisse ${new Date().getFullYear()} Ihrer Klasse.

Bei mehrfachen Einträgen: Runden addieren (Ersatzkarten).

Danke!
SV-Team`
        }
    ]);

    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const sendMailsPopup = useRef(null);

    // Helper-Funktionen
    const initializeEmptyFields = (availableClasses, mode = 'manual') => {
        const result = {};
        availableClasses.forEach((className) => {
            result[className] = mode === 'manual' ? [''] : [];
        });
        return result;
    };

    const validateEmailList = (emails) => {
        return emails.filter(email => email && email.trim());
    };

    // E-Mail-Template setzen
    const handleTemplateSelect = (template) => {
        setFileData(prev => ({ ...prev, mailText: template.content }));
    };

    // Character Count für E-Mail Text
    const getCharCount = () => fileData.mailText.length;

    // Vorschau der E-Mail-Zusammenfassung
    const getEmailSummary = () => {
        const isManualMode = emailInputMode === 'manual';
        const dataSource = isManualMode ? manualEmails : teacherData.classTeacher;
        const classCount = Object.keys(dataSource).length;

        if (isManualMode) {
            const emailCount = Object.values(manualEmails)
                .flat()
                .filter(email => email && email.trim()).length;
            const classesWithEmails = Object.keys(manualEmails)
                .filter(className => validateEmailList(manualEmails[className] || []).length > 0).length;
            const unassignedClasses = Object.keys(manualEmails)
                .filter(className => validateEmailList(manualEmails[className] || []).length === 0);

            return {
                classCount,
                recipientCount: emailCount,
                recipientType: emailCount === 1 ? 'E-Mail-Adresse' : 'E-Mail-Adressen',
                classesWithRecipients: classesWithEmails,
                unassignedClasses
            };
        } else {
            const teacherCount = Object.values(teacherData.classTeacher)
                .flat()
                .filter(teacher => teacher.id).length;
            const classesWithTeachers = Object.keys(teacherData.classTeacher)
                .filter(className => teacherData.classTeacher[className].some(teacher => teacher.id)).length;
            const unassignedClasses = Object.keys(teacherData.classTeacher)
                .filter(className => !teacherData.classTeacher[className].some(teacher => teacher.id));

            return {
                classCount,
                recipientCount: teacherCount,
                recipientType: 'Lehrer',
                classesWithRecipients: classesWithTeachers,
                unassignedClasses
            };
        }
    };

    useEffect(() => {
        const fetchAllTeachers = async () => {
            try {
                // Prüfe ob Lehrer-Modul aktiviert ist
                if (!config.teachers) {
                    setEmailInputMode('manual');
                    const availableClasses = await request('/api/getAvailableClasses');
                    setManualEmails(initializeEmptyFields(availableClasses, 'manual'));
                    return;
                }

                setEmailInputMode('teachers');

                // Lade alle Lehrer
                const data = await request('/api/getAllTeachers');

                // Lade alle verfügbaren Klassen
                const availableClasses = await request('/api/getAvailableClasses');
                const classTeacher = initializeEmptyFields(availableClasses, 'teachers');

                // Dann die bereits zugeordneten Lehrer hinzufügen
                data.forEach((teacher) => {
                    if (!teacher.klasse) return;
                    if (!classTeacher[teacher.klasse]) {
                        classTeacher[teacher.klasse] = [];
                    }
                    classTeacher[teacher.klasse].push({ id: teacher.id, name: `${teacher.nachname}, ${teacher.vorname}`, email: teacher.email });
                });

                // Sicherstellen, dass jede Klasse mindestens 1 Platz für Lehrer hat
                Object.keys(classTeacher).forEach((className) => {
                    if (classTeacher[className].length === 0) {
                        classTeacher[className].push({ id: null, name: null, email: '' });
                    }
                });

                setTeacherData((prev) => ({ ...prev, allTeachers: data, classTeacher }));
            } catch (error) {
                showError(error, 'Beim Laden aller Lehrer');
            }
        };

        fetchAllTeachers();
    }, [config.teachers, request, showError]);

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

    // Handler für manuelle E-Mail-Eingabe
    const handleManualEmailChange = (className, index, email) => {
        setManualEmails(prev => {
            const newEmails = { ...prev };
            if (!newEmails[className]) {
                newEmails[className] = [];
            }
            const classEmails = [...newEmails[className]];
            classEmails[index] = email.trim();

            // Automatisch neues leeres Feld hinzufügen wenn ausgefüllt
            if (email.trim() && !classEmails.includes('')) {
                classEmails.push('');
            }

            // Maximal ein leeres Feld am Ende
            const emptyIndices = classEmails.map((e, i) => e === '' ? i : -1).filter(i => i !== -1);
            if (emptyIndices.length > 1) {
                classEmails.splice(emptyIndices[0], 1);
            }

            newEmails[className] = classEmails;
            return newEmails;
        });
    };

    // Toggle zwischen den Modi
    const switchToManualMode = async () => {
        if (Object.keys(manualEmails).length === 0) {
            try {
                const availableClasses = await request('/api/getAvailableClasses');
                setManualEmails(initializeEmptyFields(availableClasses, 'manual'));
            } catch (error) {
                showError(error, 'Beim Laden der Klassen');
            }
        }
        setEmailInputMode('manual');
    };

    // Handler für Lehrer-Zuordnung
    const handleTeacherChange = (className, index) => (e) => {
        const newId = parseInt(e.target.value);
        const newTeachers = [...teacherData.classTeacher[className]];

        if (!newId) {
            newTeachers[index] = { id: null, name: null, email: '' };
        } else {
            const foundTeacher = teacherData.allTeachers.find((teacher) => teacher.id === newId);
            newTeachers[index] = {
                id: newId,
                name: `${foundTeacher.nachname}, ${foundTeacher.vorname}`,
                email: foundTeacher.email
            };

            // Neues leeres Feld hinzufügen wenn keines vorhanden
            if (!newTeachers.some((teacher) => teacher.id === null)) {
                newTeachers.push({ id: null, name: null, email: '' });
            }
        }

        // Maximal ein leeres Feld am Ende
        const nullIndices = newTeachers.map((t, i) => t.id === null ? i : -1).filter(i => i !== -1);
        if (nullIndices.length > 1) {
            newTeachers.splice(nullIndices[0], 1);
        }

        setTeacherData(prev => ({
            ...prev,
            classTeacher: { ...prev.classTeacher, [className]: newTeachers }
        }));
    };

    const handleSendEmails = async () => {
        if (!Object.keys(teacherData.files || {}).length) {
            showError('Bitte lade zuerst eine ZIP-Datei hoch.', 'E-Mail-Versand');
            return;
        }

        const { classCount, recipientCount, recipientType, classesWithRecipients, unassignedClasses } = getEmailSummary();
        if (recipientCount === 0) {
            const errorMessage = emailInputMode === 'manual'
                ? 'Bitte geben Sie mindestens eine E-Mail-Adresse ein.'
                : 'Bitte wählen Sie mindestens einen Lehrer für den E-Mail-Versand aus.';
            showError(errorMessage, 'E-Mail-Versand');
            return;
        }

        // Bestätigung anzeigen (mit Warnung bei unbesetzten Klassen)
        let confirmMessage = `Sie sind dabei, E-Mails an ${recipientCount} ${recipientType} für ${classesWithRecipients} von ${classCount} Klassen zu senden.`;

        if (unassignedClasses.length > 0) {
            confirmMessage += `\n\nHinweis: ${unassignedClasses.length} Klassen (${unassignedClasses.join(', ')}) haben keine ${emailInputMode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer'} zugeordnet und erhalten keine E-Mails.`;
        }

        confirmMessage += '\n\nMöchten Sie fortfahren?';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setStatus((prev) => ({
            ...prev,
            sendMailLoading: true,
            sendProgress: 0
        }));

        try {
            let emailData = {};

            if (emailInputMode === 'manual') {
                // Verwende manuelle E-Mail-Eingaben
                Object.keys(manualEmails).forEach((className) => {
                    const validEmails = validateEmailList(manualEmails[className] || []);
                    if (validEmails.length > 0) {
                        emailData[className] = validEmails.map((email, index) => ({
                            id: `manual-${index}`,
                            email: email.trim(),
                            name: `Manuell eingegebene E-Mail ${index + 1}`
                        }));
                    }
                });
            } else {
                // Verwende Lehrer-Zuordnungen
                Object.keys(teacherData.classTeacher).forEach((className) => {
                    emailData[className] = teacherData.classTeacher[className].filter((teacher) => teacher.id);
                });
            }

            // Simuliere Progress-Update (da der API-Call das nicht unterstützt)
            const progressInterval = setInterval(() => {
                setStatus((prev) => ({
                    ...prev,
                    sendProgress: Math.min(prev.sendProgress + 10, 90)
                }));
            }, 500);

            const data = await request('/api/send-mails', {
                method: 'POST',
                data: {
                    teacherEmails: emailData,
                    teacherFiles: teacherData.files,
                    mailText: fileData.mailText,
                    email: fileData.email,
                    password: fileData.password,
                    senderName: fileData.senderName,
                    emailProvider: fileData.emailProvider
                },
                errorContext: 'Beim Senden der E-Mails'
            });

            clearInterval(progressInterval);
            setStatus((prev) => ({
                ...prev,
                sendMailLoading: false,
                sendProgress: 100
            }));

            showSuccess(data.message || `E-Mails wurden erfolgreich versendet!`, 'E-Mail-Versand');

            setStatus((prev) => ({ ...prev, sendProgress: 0 }));

        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            setStatus((prev) => ({
                ...prev,
                sendMailLoading: false,
                sendProgress: 0
            }));
        }
    };

    // Komponente für Klassen-Assignment-Card
    const ClassAssignmentCard = ({ className, mode }) => {
        const isManual = mode === 'manual';
        const data = isManual ? manualEmails[className] || [] : teacherData.classTeacher[className] || [];
        const count = isManual
            ? validateEmailList(data).length
            : data.filter(t => t.id).length;
        const hasAssignments = count > 0;

        return (
            <div className="class-assignment-card">
                <div className="class-assignment-header">
                    <h3 className="class-assignment-name">Klasse {className}</h3>
                    <div className="teacher-count-badge">
                        {count} {isManual ? 'E-Mails' : 'Lehrer'}
                    </div>
                </div>

                <div className="teacher-assignment-list">
                    {isManual ? (
                        data.map((email, index) => (
                            <div key={index} className="teacher-assignment-row">
                                <input
                                    type="email"
                                    placeholder="E-Mail-Adresse eingeben..."
                                    value={email || ''}
                                    onChange={(e) => handleManualEmailChange(className, index, e.target.value)}
                                    className="manual-email-input"
                                />
                            </div>
                        ))
                    ) : (
                        data.map((teacher, index) => (
                            <div key={index} className="teacher-assignment-row">
                                <select
                                    value={teacher.id || ''}
                                    onChange={handleTeacherChange(className, index)}
                                    className="teacher-assignment-select"
                                >
                                    <option value="">Lehrer auswählen...</option>
                                    {teacherData.allTeachers.map((teacherOption) => (
                                        <option key={teacherOption.id} value={teacherOption.id}>
                                            {teacherOption.vorname} {teacherOption.nachname}
                                            {teacherOption.email && ` (${teacherOption.email})`}
                                        </option>
                                    ))}
                                </select>
                                {teacher.id && teacher.email && (
                                    <div className="teacher-email-display">
                                        {teacher.email}
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {!hasAssignments && (
                        <div className="no-teachers-warning">
                            <span className="no-teachers-warning-icon">⚠️</span>
                            <span>
                                Noch keine {isManual ? 'E-Mail-Adressen eingegeben' : 'Lehrer zugeordnet'} -
                                E-Mails können für diese Klasse nicht versendet werden
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="mail-page-container">
            {/* Header */}
            <div className="mail-header">
                <h1 className="mail-header-title">
                    <span className="header-icon">📧</span>
                    E-Mails versenden
                </h1>
                <p className="mail-description">
                    Generieren und versenden Sie automatisch Klassenlisten mit den gelaufenen Runden
                    der Schüler an die jeweiligen Klassenlehrer. Das System erstellt für jede Klasse
                    eine Excel-Datei und versendet diese per E-Mail.
                </p>

                {!Object.keys(teacherData.files).length && (
                    <div className="text-center" style={{ marginTop: '2rem' }}>
                        <button
                            className="btn btn-primary btn-lg mail-start-button"
                            onClick={() => sendMailsPopup.current.showModal()}
                        >
                            <span className="button-icon">🚀</span>
                            E-Mail-Versand starten
                        </button>
                    </div>
                )}
            </div>

            {/* Dialog for Email Configuration */}
            <SendMailsDialog
                dialogRef={sendMailsPopup}
                fileData={fileData}
                setFileData={setFileData}
                credentialsCorrect={credentialsCorrect}
                handleLogin={handleLogin}
                status={status}
                handleUpload={handleUpload}
            />

            {/* Teacher Email Configuration - Only show after files are loaded */}
            {Object.keys(teacherData.files).length > 0 && (
                <>
                    <div className="class-email-section">
                        <h2 className="section-title">
                            <span className="title-icon">�</span>
                            E-Mail Empfänger
                        </h2>
                        <p className="text-muted mb-3">
                            {config.teachers ?
                                "Weisen Sie jeder Klasse die entsprechenden Lehrer zu oder geben Sie E-Mail-Adressen manuell ein." :
                                "Das Lehrer-Modul ist deaktiviert. Geben Sie für jede Klasse die E-Mail-Adressen manuell ein."
                            }
                        </p>

                        {/* Input Mode Toggle (nur anzeigen wenn Lehrer-Modul aktiviert ist) */}
                        {config.teachers && (
                            <div className="input-mode-toggle">
                                <button
                                    className={`input-mode-button ${emailInputMode === 'teachers' ? 'active' : ''}`}
                                    onClick={() => setEmailInputMode('teachers')}
                                >
                                    Lehrer zuordnen
                                </button>
                                <button
                                    className={`input-mode-button ${emailInputMode === 'manual' ? 'active' : ''}`}
                                    onClick={switchToManualMode}
                                >
                                    E-Mails manuell eingeben
                                </button>
                            </div>
                        )}

                        {/* Teacher Assignment Mode */}
                        {emailInputMode === 'teachers' && config.teachers && (
                            <div className="classes-grid">
                                {Object.keys(teacherData.classTeacher).map((className) => (
                                    <ClassAssignmentCard
                                        key={className}
                                        className={className}
                                        mode="teachers"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Manual Email Input Mode */}
                        {emailInputMode === 'manual' && (
                            <div className="classes-grid">
                                {Object.keys(manualEmails).map((className) => (
                                    <ClassAssignmentCard
                                        key={className}
                                        className={className}
                                        mode="manual"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mail Content Editor */}
                    <div className="mail-content-section">
                        <h2 className="mail-content-title">
                            <span className="title-icon">✏️</span>
                            E-Mail Inhalt
                        </h2>

                        <MailTemplateSelector
                            templates={mailTemplates}
                            onSelect={handleTemplateSelect}
                            currentText={fileData.mailText}
                            onChange={(text) => setFileData((prev) => ({ ...prev, mailText: text }))}
                        />

                        <div className="form-group">
                            <textarea
                                value={fileData.mailText}
                                onChange={(e) => setFileData((prev) => ({ ...prev, mailText: e.target.value }))}
                                className="mail-textarea"
                                placeholder="Verfassen Sie hier Ihre E-Mail-Nachricht..."
                                rows="12"
                            />
                            <div className="mail-char-counter">
                                {getCharCount()} Zeichen
                            </div>
                        </div>
                    </div>

                    {/* Send Actions */}
                    <div className="send-actions">
                        {(() => {
                            const { classCount, recipientCount, recipientType, classesWithRecipients, unassignedClasses } = getEmailSummary();
                            return (
                                <>
                                    <div className="send-preview">
                                        <span className="preview-icon">📋</span>
                                        <span>
                                            Bereit zum Versenden an <strong>{recipientCount} {recipientType}</strong> für <strong>{classesWithRecipients} von {classCount} Klassen</strong>
                                        </span>
                                    </div>

                                    {/* Warnung bei unbesetzten Klassen */}
                                    {unassignedClasses.length > 0 && (
                                        <div className="unassigned-classes-warning">
                                            <span className="warning-icon">⚠️</span>
                                            <div className="warning-content">
                                                <strong>Hinweis:</strong> {unassignedClasses.length} Klassen haben noch keine {emailInputMode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer'} zugeordnet:
                                                <div className="unassigned-list">
                                                    {unassignedClasses.map((className, index) => (
                                                        <span key={className} className="unassigned-class">
                                                            {className}{index < unassignedClasses.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                                <small>Diese Klassen erhalten keine E-Mails.</small>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        <button
                            onClick={handleSendEmails}
                            className="btn btn-success send-button"
                            disabled={status.sendMailLoading}
                        >
                            <span className="button-icon">📤</span>
                            {status.sendMailLoading ? 'E-Mails werden gesendet...' : 'E-Mails jetzt senden'}
                        </button>

                        {status.sendMailLoading && (
                            <div className="send-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${status.sendProgress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-text">
                                    {status.sendProgress}% abgeschlossen
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}