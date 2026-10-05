import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { useApi } from '../../hooks/useApi';
import { useGlobalError } from '../../contexts/ErrorContext';
import { useModuleConfig } from '../../contexts/ModuleConfigContext';
import BaseDialog from '../BaseDialog';
import MailTemplateSelector from '../dialogs/mails/MailTemplateSelector';
import { matchClassName } from '../../utils/importHelpers';

// ===================================================================
// CONSTANTS & TEMPLATES
// ===================================================================
const EMAIL_TEMPLATES = [
    {
        name: 'Standard',
        content: `Sehr geehrte Lehrkraft,

anbei finden Sie die Liste der Schülerinnen und Schüler Ihrer Klasse für den Sponsorenlauf ${new Date().getFullYear()}.

Bei Fragen oder Unklarheiten können Sie gerne auf diese E-Mail antworten oder sich direkt an die Schülervertretung wenden.

Mit freundlichen Grüßen,

Ihr SV-Team`
    },
    {
        name: 'Freundlich',
        content: `Liebe Klassenlehrerin, lieber Klassenlehrer,

wir hoffen, es geht Ihnen gut! Anbei senden wir Ihnen die Ergebnisliste Ihrer Klasse vom Sponsorenlauf ${new Date().getFullYear()}.

📊 Die Excel-Datei enthält alle Laufergebnisse Ihrer Schülerinnen und Schüler übersichtlich aufgelistet.

Sollten Sie Fragen haben, antworten Sie einfach auf diese E-Mail oder wenden Sie sich an die Schülervertretung.

Vielen Dank für Ihre Unterstützung!

Herzliche Grüße
Das SV-Team`
    },
    {
        name: 'Kurz & Knapp',
        content: `Hallo,

anbei die Sponsorenlauf-Ergebnisse ${new Date().getFullYear()} Ihrer Klasse.

Bei Fragen einfach antworten oder SV kontaktieren.

Danke!
SV-Team`
    }
];

const DEFAULT_EMAIL_SETTINGS = {
    host: 'smtp.office365.com',
    port: 587,
    security: 'starttls',
    username: '',
    password: '',
    fromAddress: '',
    fromName: 'Schülervertretung',
    passwordConfigured: false,
    mailSubject: 'Sponsorenlauf {jahr} – Ergebnisliste Klasse {klasse}',
    mailText: EMAIL_TEMPLATES[0].content
};

const getClassFile = (files, className) => {
    const match = matchClassName(className, Object.keys(files || {}));
    return ['exact', 'normalized', 'token'].includes(match.status) ? files[match.value] : null;
};

// ===================================================================
// CUSTOM HOOKS
// ===================================================================
const useConnectivity = (active) => {
    const [isConnected, setIsConnected] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const { request } = useApi();

    const checkConnectivity = useCallback(async () => {
        setIsChecking(true);
        try {
            const result = await request('/api/check-mail-connectivity', { timeout: 15000, showErrorMessage: false });
            setIsConnected(Boolean(result?.connected));
        } catch (error) {
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    }, [request]);

    useEffect(() => {
        if (!active) return undefined;
        checkConnectivity();
        const interval = setInterval(checkConnectivity, 30000);
        return () => clearInterval(interval);
    }, [checkConnectivity, active]);

    return { isConnected, isChecking, checkConnectivity };
};

const useSmtpConfiguration = (setEmailSettings, active) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { request } = useApi();

    useEffect(() => {
        if (!active) return;
        const load = async () => {
            try {
                const result = await request('/api/smtp-settings', { showErrorMessage: false });
                if (result?.configuration) {
                    setEmailSettings((current) => ({
                        ...current,
                        ...result.configuration,
                        password: '',
                    }));
                    setIsAuthenticated(Boolean(result.configured));
                }
            } catch {
                setIsAuthenticated(false);
            }
        };
        load();
    }, [active, request, setEmailSettings]);

    return { isAuthenticated };
};

const useFileGeneration = () => {
    const [files, setFiles] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();

    const generateFiles = async () => {
        setIsGenerating(true);

        try {
            const zipBlob = await request('/api/exportExcel', {
                responseType: 'blob',
                errorContext: 'Beim Generieren der Excel-Dateien'
            });

            const zip = new JSZip();
            const zipContent = await zip.loadAsync(zipBlob);
            const extractedFiles = {};

            await Promise.all(
                Object.keys(zipContent.files).map(async (filename) => {
                    const fileContent = await zipContent.files[filename].async('base64');
                    extractedFiles[filename.replace('.xlsx', '')] = fileContent;
                })
            );

            setFiles(extractedFiles);
            showSuccess('Excel-Dateien erfolgreich generiert!', 'Datei-Generierung');
        } catch (error) {
            showError('Fehler beim Generieren der Excel-Dateien', 'Datei-Generierung');
        } finally {
            setIsGenerating(false);
        }
    };

    return { files, isGenerating, generateFiles };
};

// ===================================================================
// COMPONENTS
// ===================================================================
const ConnectivityStatus = ({ isConnected, isChecking, onRefresh }) => (
    <div className="connectivity-check-compact">
        <div className="connectivity-status-compact">
            {isChecking ? (
                <span className="connectivity-badge loading">
                    <span className="spinner-mini"></span>
                    Prüfe Verbindung...
                </span>
            ) : isConnected === true ? (
                <span className="connectivity-badge connected">
                    ✅ E-Mail-Dienst erreichbar
                </span>
            ) : isConnected === false ? (
                <span className="connectivity-badge disconnected">
                    ⚠️ E-Mail-Dienst nicht bestätigt
                </span>
            ) : (
                <span className="connectivity-badge unknown">
                    ⏳ Verbindung prüfen...
                </span>
            )}

            <button
                className="connectivity-refresh-compact"
                onClick={onRefresh}
                disabled={isChecking}
                title="E-Mail-Dienst erneut prüfen"
            >
                🔄
            </button>
        </div>

        {isConnected === false && (
            <div className="connectivity-warning-compact">
                Die Verbindung zum E-Mail-Dienst konnte nicht bestätigt werden. Sie können den Versand trotzdem versuchen.
            </div>
        )}
    </div>
);

const ModeToggle = ({ currentMode, onModeChange, isTeacherModuleEnabled }) => {
    if (!isTeacherModuleEnabled) return null;

    return (
        <div className="input-mode-toggle">
            <button
                className={`input-mode-button ${currentMode === 'teachers' ? 'active' : ''}`}
                onClick={() => onModeChange('teachers')}
            >
                Lehrer zuordnen
            </button>
            <button
                className={`input-mode-button ${currentMode === 'manual' ? 'active' : ''}`}
                onClick={() => onModeChange('manual')}
            >
                E-Mails manuell eingeben
            </button>
        </div>
    );
};

const TeacherAssignmentRow = ({ teacher, index, allTeachers, onTeacherChange, isLastEmpty = false }) => (
    <div className={`teacher-assignment-row ${isLastEmpty ? 'empty-field' : ''}`}>
        <select
            value={teacher.id || ''}
            onChange={(e) => onTeacherChange(index, e.target.value ? parseInt(e.target.value) : null)}
            className="teacher-assignment-select"
        >
            <option value="">{isLastEmpty ? '+ Lehrer hinzufügen...' : 'Lehrer auswählen...'}</option>
            {allTeachers.map(teacherOption => (
                <option key={teacherOption.id} value={teacherOption.id}>
                    {teacherOption.vorname} {teacherOption.nachname}
                </option>
            ))}
        </select>
        {teacher.id && teacher.email && (
            <div className="teacher-email-display">
                {teacher.email}
            </div>
        )}
    </div>
);

const ManualEmailRow = ({ email, index, onEmailChange, isLastEmpty = false }) => (
    <div className={`teacher-assignment-row ${isLastEmpty ? 'empty-field' : ''}`}>
        <input
            type="email"
            placeholder={isLastEmpty ? '+ E-Mail-Adresse hinzufügen...' : 'E-Mail-Adresse eingeben...'}
            value={email || ''}
            onChange={(e) => onEmailChange(index, e.target.value)}
            className="manual-email-input"
        />
    </div>
);

const ClassAssignmentCard = ({
    className,
    hasFile,
    mode,
    teacherData,
    manualEmailData,
    onTeacherChange,
    onEmailChange
}) => {
    const isManual = mode === 'manual';
    const data = isManual ? manualEmailData.emails : teacherData.assignments;

    // Count valid (filled) entries
    const validCount = isManual ?
        data.filter(email => email && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())).length :
        data.filter(t => t.id).length;

    return (
        <div className="class-assignment-card">
            <div className="class-assignment-header">
                <h3 className="class-assignment-name">Klasse {className}</h3>
                <div className="class-assignment-badges">
                    <span className={`class-file-indicator ${hasFile ? 'is-ready' : 'is-missing'}`}>
                        <span aria-hidden="true">{hasFile ? '✓' : '–'}</span>
                        {hasFile ? 'Liste bereit' : 'Keine Liste'}
                    </span>
                    <span className="teacher-count-badge">{validCount} {isManual ? 'E-Mails' : 'Lehrer'}</span>
                </div>
            </div>

            <div className="teacher-assignment-list">
                {data.length === 0 ? (
                    <div className="no-fields-message">
                        <span className="no-fields-icon">📝</span>
                        <span>
                            Beginnen Sie mit der Eingabe von {isManual ? 'E-Mail-Adressen' : 'Lehrer-Zuordnungen'}.
                        </span>
                    </div>
                ) : (
                    <>
                        {isManual ? (
                            data.map((email, index) => (
                                <ManualEmailRow
                                    key={index}
                                    email={email}
                                    index={index}
                                    onEmailChange={(idx, value) => onEmailChange(className, idx, value)}
                                    isLastEmpty={index === data.length - 1 && (!email || !email.trim())}
                                />
                            ))
                        ) : (
                            data.map((teacher, index) => (
                                <TeacherAssignmentRow
                                    key={index}
                                    teacher={teacher}
                                    index={index}
                                    allTeachers={teacherData.allTeachers}
                                    onTeacherChange={(idx, teacherId) => onTeacherChange(className, idx, teacherId)}
                                    isLastEmpty={index === data.length - 1 && !teacher.id}
                                />
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const SendProgress = ({ isLoading, classCount }) => {
    if (!isLoading) return null;

    return (
        <div className="mail-sending-state" role="status" aria-live="polite">
            <span className="mail-sending-spinner" aria-hidden="true" />
            <div><strong>E-Mails werden versendet</strong><span>Bitte warten Sie, während {classCount} Klassen verarbeitet werden.</span></div>
        </div>
    );
};

const EmailSummary = ({ summary, mode }) => {
    const { totalClasses, sendableClasses, sendableRecipients, unassignedClasses } = summary;
    const recipientType = mode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer';

    return (
        <div className="send-actions">
            <div className="send-preview">
                <span className="preview-icon">📋</span>
                <span>
                    Bereit zum Versenden an <strong>{sendableRecipients} {recipientType}</strong> für <strong>{sendableClasses} von {totalClasses} Klassen</strong>
                </span>
            </div>

            {unassignedClasses.length > 0 && (
                <div className="unassigned-classes-warning">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-content">
                        <strong>Hinweis:</strong> {unassignedClasses.length} Klassen haben noch keine {mode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer'} zugeordnet:
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
        </div>
    );
};

// ===================================================================
// MAIN COMPONENT
// ===================================================================
export default function MailsPanel({ embedded = false, active = true }) {
    const router = useRouter();
    // Hooks
    const { config } = useModuleConfig();
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { isConnected, isChecking, checkConnectivity } = useConnectivity(active);
    const { files, isGenerating, generateFiles } = useFileGeneration();

    // State
    const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_SETTINGS);
    const { isAuthenticated } = useSmtpConfiguration(setEmailSettings, active);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [emailMode, setEmailMode] = useState(config.teachers ? 'teachers' : 'manual');
    useEffect(() => {
        if (!config.teachers && emailMode === 'teachers') setEmailMode('manual');
    }, [config.teachers, emailMode]);

    // Teacher data
    const [allTeachers, setAllTeachers] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState({});

    // Manual email data
    const [manualEmails, setManualEmails] = useState({});

    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const [classSearch, setClassSearch] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [sendCopyToSender, setSendCopyToSender] = useState(false);

    // Refs
    const sendConfirmPopup = useRef(null);
    const sendResultRef = useRef(null);

    useEffect(() => {
        if (!sendResult) return;
        requestAnimationFrame(() => {
            sendResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            sendResultRef.current?.focus({ preventScroll: true });
        });
    }, [sendResult]);

    // Refresh lists when returning to this workspace without discarding recipients.
    useEffect(() => {
        if (!active) return;
        const initializeData = async () => {
            try {
                const classes = await request('/api/getAvailableClasses');
                setAvailableClasses(classes);

                // Initialize teacher assignments with one empty field per class
                const initialTeacherAssignments = {};
                classes.forEach(className => {
                    initialTeacherAssignments[className] = [{ id: null, name: null, email: '' }];
                });

                // Initialize manual emails with one empty field per class
                const initialManualEmails = {};
                classes.forEach(className => {
                    initialManualEmails[className] = [''];
                });

                if (!config.teachers) setTeacherAssignments(current => ({ ...initialTeacherAssignments, ...current }));
                setManualEmails(current => ({ ...initialManualEmails, ...current }));

                if (config.teachers) {
                    const teachers = await request('/api/getAllTeachers');
                    setAllTeachers(teachers);

                    // Assign existing teachers and ensure exactly one empty field at end
                    const updatedAssignments = { ...initialTeacherAssignments };

                    // Group teachers by class
                    const teachersByClass = {};
                    teachers.forEach(teacher => {
                        if (!teachersByClass[teacher.klasse]) {
                            teachersByClass[teacher.klasse] = [];
                        }
                        teachersByClass[teacher.klasse].push({
                            id: teacher.id,
                            name: `${teacher.nachname}, ${teacher.vorname}`,
                            email: teacher.email
                        });
                    });

                    // Set up assignments: filled teachers + exactly one empty field
                    classes.forEach(className => {
                        const classTeachers = teachersByClass[className] || [];
                        updatedAssignments[className] = [...classTeachers, { id: null, name: null, email: '' }];
                    });

                    setTeacherAssignments(current => ({ ...updatedAssignments, ...current }));
                }
            } catch (error) {
                showError(error, 'Beim Laden der Daten');
            }
        };

        initializeData();
    }, [active, config.teachers, request, showError]);

    // Event Handlers
    const handleEmailSettingsChange = (field, value) => {
        setEmailSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleTemplateSelect = (template) => {
        setEmailSettings(prev => ({ ...prev, mailText: template.content }));
    };

    const handleModeChange = (mode) => {
        setEmailMode(mode);

        if (mode === 'teachers') {
            // Ensure each class has exactly one empty teacher slot
            setTeacherAssignments(prev => {
                const updated = { ...prev };
                availableClasses.forEach(className => {
                    if (!updated[className] || updated[className].length === 0) {
                        updated[className] = [{ id: null, name: null, email: '' }];
                    } else {
                        // Clean up: ensure exactly one empty field
                        const filledTeachers = updated[className].filter(t => t.id);
                        updated[className] = [...filledTeachers, { id: null, name: null, email: '' }];
                    }
                });
                return updated;
            });
        } else if (mode === 'manual') {
            // Ensure each class has exactly one empty email slot
            setManualEmails(prev => {
                const updated = { ...prev };
                availableClasses.forEach(className => {
                    if (!updated[className] || updated[className].length === 0) {
                        updated[className] = [''];
                    } else {
                        // Clean up: ensure exactly one empty field
                        const filledEmails = updated[className].filter(e => e && e.trim());
                        updated[className] = [...filledEmails, ''];
                    }
                });
                return updated;
            });
        }
    };

    const handleTeacherChange = (className, index, teacherId) => {
        setTeacherAssignments(prev => {
            const updated = { ...prev };
            const classTeachers = [...updated[className]];

            if (!teacherId) {
                classTeachers[index] = { id: null, name: null, email: '' };
            } else {
                const teacher = allTeachers.find(t => t.id === teacherId);
                if (teacher) {
                    classTeachers[index] = {
                        id: teacher.id,
                        name: `${teacher.nachname}, ${teacher.vorname}`,
                        email: teacher.email
                    };
                }
            }

            // Clean up: remove extra empty fields, keep exactly one
            const filledTeachers = classTeachers.filter(t => t.id);

            // Always have exactly one empty field
            updated[className] = [...filledTeachers, { id: null, name: null, email: '' }];

            return updated;
        });
    };

    const handleEmailChange = (className, index, email) => {
        setManualEmails(prev => {
            const updated = { ...prev };
            const classEmails = [...updated[className]];
            classEmails[index] = email.trim();

            // Clean up: remove extra empty fields, keep exactly one
            const filledEmails = classEmails.filter(e => e && e.trim());

            // Always have exactly one empty field
            updated[className] = [...filledEmails, ''];

            return updated;
        });
    };

    // Helper functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const getValidEmails = (className) => {
        return manualEmails[className]?.filter(email =>
            email && email.trim() && validateEmail(email.trim())
        ) || [];
    };

    const getAssignedTeachers = (className) => {
        return teacherAssignments[className]?.filter(teacher => teacher.id) || [];
    };

    const getCurrentSummary = () => {
        const hasFile = (className) => Boolean(getClassFile(files, className));
        if (emailMode === 'teachers') {
            const assignedClasses = availableClasses.filter(className =>
                getAssignedTeachers(className).length > 0
            );
            const totalRecipients = availableClasses.reduce((sum, className) =>
                sum + getAssignedTeachers(className).length, 0
            );
            const sendable = assignedClasses.filter(hasFile);

            return {
                totalClasses: availableClasses.length,
                assignedClasses: assignedClasses.length,
                totalRecipients,
                sendableClasses: sendable.length,
                sendableRecipients: sendable.reduce((sum, className) => sum + getAssignedTeachers(className).length, 0),
                missingFileClasses: assignedClasses.filter(className => !hasFile(className)),
                unassignedClasses: availableClasses.filter(className =>
                    hasFile(className) && getAssignedTeachers(className).length === 0
                )
            };
        } else {
            const assignedClasses = availableClasses.filter(className =>
                getValidEmails(className).length > 0
            );
            const totalRecipients = availableClasses.reduce((sum, className) =>
                sum + getValidEmails(className).length, 0
            );
            const sendable = assignedClasses.filter(hasFile);

            return {
                totalClasses: availableClasses.length,
                assignedClasses: assignedClasses.length,
                totalRecipients,
                sendableClasses: sendable.length,
                sendableRecipients: sendable.reduce((sum, className) => sum + getValidEmails(className).length, 0),
                missingFileClasses: assignedClasses.filter(className => !hasFile(className)),
                unassignedClasses: availableClasses.filter(className =>
                    hasFile(className) && getValidEmails(className).length === 0
                )
            };
        }
    };

    const getEmailData = () => {
        const emailData = {};

        if (emailMode === 'teachers') {
            availableClasses.forEach(className => {
                const assignedTeachers = getAssignedTeachers(className);
                if (assignedTeachers.length > 0) {
                    emailData[className] = assignedTeachers;
                }
            });
        } else {
            availableClasses.forEach(className => {
                const validEmails = getValidEmails(className);
                if (validEmails.length > 0) {
                    emailData[className] = validEmails.map((email, index) => ({
                        id: `manual-${index}`,
                        email: email.trim(),
                        name: `Manuell eingegebene E-Mail ${index + 1}`
                    }));
                }
            });
        }

        return emailData;
    };
    const executeSendEmails = async () => {
        if (!Object.keys(files).length) {
            showError('Bitte generieren Sie zuerst die Excel-Dateien.', 'E-Mail-Versand');
            return;
        }

        const summary = getCurrentSummary();

        if (summary.totalRecipients === 0) {
            const errorMessage = emailMode === 'manual'
                ? 'Bitte geben Sie mindestens eine E-Mail-Adresse ein.'
                : 'Bitte wählen Sie mindestens einen Lehrer für den E-Mail-Versand aus.';
            showError(errorMessage, 'E-Mail-Versand');
            return;
        }
        if (summary.sendableRecipients === 0) {
            showError('Für die ausgewählten Klassen sind keine Ergebnislisten verfügbar. Es gibt daher nichts zu versenden.', 'E-Mail-Versand');
            return;
        }

        setIsSending(true);
        setSendResult(null);

        try {
            const emailData = getEmailData();

            const result = await request('/api/send-mails', {
                method: 'POST',
                data: {
                    teacherEmails: emailData,
                    teacherFiles: Object.fromEntries(
                        Object.keys(emailData).map((className) => [className, getClassFile(files, className)])
                    ),
                    mailSubject: emailSettings.mailSubject,
                    mailText: emailSettings.mailText,
                    sendCopyToSender: sendCopyToSender
                },
                errorContext: 'Beim Senden der E-Mails',
                timeout: 5 * 60 * 1000
            });
            setSendResult(result);
            if (result.results?.failed > 0) {
                showError(result.message, 'E-Mail-Versand teilweise fehlgeschlagen');
            } else {
                showSuccess(result.message || 'E-Mails wurden erfolgreich versendet!', 'E-Mail-Versand');
            }
        } catch (error) {
            // Error is handled by useApi
        } finally {
            setIsSending(false);
        }
    };

    const handleSendEmails = () => {
        if (!Object.keys(files).length) {
            showError('Bitte generieren Sie zuerst die Excel-Dateien.', 'E-Mail-Versand');
            return;
        }

        const currentSummary = getCurrentSummary();

        if (currentSummary.totalRecipients === 0) {
            const errorMessage = emailMode === 'manual'
                ? 'Bitte geben Sie mindestens eine E-Mail-Adresse ein.'
                : 'Bitte wählen Sie mindestens einen Lehrer für den E-Mail-Versand aus.';
            showError(errorMessage, 'E-Mail-Versand');
            return;
        }
        if (currentSummary.sendableRecipients === 0) {
            showError('Für die ausgewählten Klassen sind keine Ergebnislisten verfügbar. Es gibt daher nichts zu versenden.', 'E-Mail-Versand');
            return;
        }

        sendConfirmPopup.current?.showModal();
    };

    // Get current summary for display
    const summary = getCurrentSummary();
    const visibleClasses = availableClasses.filter((className) => {
        const matchesSearch = className.toLocaleLowerCase('de').includes(classSearch.trim().toLocaleLowerCase('de'));
        const hasRecipient = emailMode === 'manual' ? getValidEmails(className).length > 0 : getAssignedTeachers(className).length > 0;
        const isReady = hasRecipient && Boolean(getClassFile(files, className));
        return matchesSearch && (classFilter === 'all' || (classFilter === 'ready' ? isReady : !isReady));
    });

    return (
        <div className={embedded ? "setup-resource-panel mail-page-container" : "app-page mail-page-container"}>
            {/* Header */}
            <div className="mail-header">
                <h1 className="mail-header-title" data-tour="mail">
                    {embedded ? 'Ergebnisse versenden' : 'E-Mails versenden'}
                </h1>
                <p className="mail-description">
                    Versenden Sie automatisch Excel-Listen mit den Sponsorenlauf-Ergebnissen
                    an die jeweiligen Klassenlehrer. Das System erstellt für jede Klasse
                    eine individuelle Excel-Datei und versendet diese per E-Mail.
                </p>

                {/* Status Overview */}
                <div className="mail-flow-steps" aria-label="Versandfortschritt">
                    <div className={`mail-flow-step ${isAuthenticated ? 'is-complete' : 'is-current'}`}><span>1</span><div><strong>Versand verbinden</strong><small>{isAuthenticated ? 'Eingerichtet' : 'Noch erforderlich'}</small></div></div>
                    <div className={`mail-flow-step ${Object.keys(files).length ? 'is-complete' : isAuthenticated ? 'is-current' : ''}`}><span>2</span><div><strong>Listen vorbereiten</strong><small>{Object.keys(files).length ? `${Object.keys(files).length} Dateien bereit` : 'Excel-Dateien erstellen'}</small></div></div>
                    <div className={`mail-flow-step ${Object.keys(files).length ? 'is-current' : ''}`}><span>3</span><div><strong>Prüfen & senden</strong><small>Empfänger und Nachricht</small></div></div>
                </div>

                <div className="mail-status-overview">
                    <div className="status-item">
                        <span className="status-icon"><i className="fa-solid fa-globe" aria-hidden="true" /></span>
                        <span className="status-label">E-Mail-Dienst:</span>
                        <span className={`status-value ${isConnected ? 'success' : 'error'}`}>
                            {isChecking ? 'Prüfe...' : (isConnected === null ? 'Unbekannt' : isConnected ? 'Verfügbar' : 'Nicht bestätigt')}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-icon"><i className="fa-solid fa-lock" aria-hidden="true" /></span>
                        <span className="status-label">E-Mail-Versand:</span>
                        <span className={`status-value ${isAuthenticated ? 'success' : 'pending'}`}>
                            {isAuthenticated
                                ? (emailSettings.provider === 'microsoft' ? 'Microsoft 365 (OAuth)' : 'SMTP konfiguriert')
                                : 'Nicht konfiguriert'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-icon"><i className="fa-solid fa-file-excel" aria-hidden="true" /></span>
                        <span className="status-label">Excel-Dateien:</span>
                        <span className={`status-value ${Object.keys(files).length > 0 ? 'success' : 'pending'}`}>
                            {Object.keys(files).length > 0 ? `${Object.keys(files).length} Dateien bereit` : 'Nicht generiert'}
                        </span>
                    </div>
                </div>

                {!Object.keys(files).length && (
                    <div className="email-start-section">
                        <ConnectivityStatus
                            isConnected={isConnected}
                            isChecking={isChecking}
                            onRefresh={checkConnectivity}
                        />

                        <button
                            className="btn btn-lg mail-start-button btn-primary"
                            onClick={() => isAuthenticated ? generateFiles() : router.push('/setup?view=smtpSettings')}
                            disabled={isGenerating}
                        >
                            <span className="button-icon">{isAuthenticated ? '🚀' : '⚙️'}</span>
                            {isGenerating ? 'Excel-Dateien werden erstellt…' : isAuthenticated ? 'E-Mail-Versand vorbereiten' : 'E-Mail-Versand unter Einstellungen einrichten'}
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content - Show after files are generated */}
            {Object.keys(files).length > 0 && (
                <>
                    {/* Email Recipients Section */}
                    <div className="class-email-section">
                        <h2 className="section-title">
                            <span className="ui-icon"><i className="fa-solid fa-users" aria-hidden="true" /></span>
                            E-Mail Empfänger
                        </h2>
                        <p className="text-muted mb-3">
                            {config.teachers ?
                                "Weisen Sie jeder Klasse die entsprechenden Lehrer zu oder geben Sie E-Mail-Adressen manuell ein." :
                                "Das Lehrer-Modul ist deaktiviert. Geben Sie für jede Klasse die E-Mail-Adressen manuell ein."
                            }
                        </p>

                        <ModeToggle
                            currentMode={emailMode}
                            onModeChange={handleModeChange}
                            isTeacherModuleEnabled={config.teachers}
                        />

                        <div className="mail-class-toolbar">
                            <label><span className="sr-only">Klasse suchen</span><input type="search" value={classSearch} onChange={(event) => setClassSearch(event.target.value)} placeholder="Klasse suchen…" /></label>
                            <div className="mail-filter-group" aria-label="Klassen filtern">
                                <button type="button" className={classFilter === 'all' ? 'active' : ''} onClick={() => setClassFilter('all')}>Alle <span>{availableClasses.length}</span></button>
                                <button type="button" className={classFilter === 'ready' ? 'active' : ''} onClick={() => setClassFilter('ready')}>Bereit <span>{summary.sendableClasses}</span></button>
                                <button type="button" className={classFilter === 'missing' ? 'active' : ''} onClick={() => setClassFilter('missing')}>Nicht bereit <span>{summary.totalClasses - summary.sendableClasses}</span></button>
                            </div>
                        </div>

                        {/* Assignment Grid */}
                        <div className="classes-grid">
                            {visibleClasses.map(className => (
                                <ClassAssignmentCard
                                    key={className}
                                    className={className}
                                    hasFile={Boolean(getClassFile(files, className))}
                                    mode={emailMode}
                                    teacherData={{
                                        assignments: teacherAssignments[className] || [],
                                        allTeachers: allTeachers
                                    }}
                                    manualEmailData={{
                                        emails: manualEmails[className] || []
                                    }}
                                    onTeacherChange={handleTeacherChange}
                                    onEmailChange={handleEmailChange}
                                />
                            ))}
                        </div>
                        {visibleClasses.length === 0 && <div className="mail-empty-filter">Keine Klassen entsprechen diesem Filter.</div>}
                    </div>

                    {/* Mail Content Section */}
                    <div className="mail-content-section">
                        <h2 className="mail-content-title">
                            <span className="title-icon">✏️</span>
                            E-Mail Inhalt
                        </h2>

                        <MailTemplateSelector
                            templates={EMAIL_TEMPLATES}
                            onSelect={handleTemplateSelect}
                        />

                        <div className="form-group mail-subject-field">
                            <label className="form-label" htmlFor="mail-subject">Betreff</label>
                            <input
                                id="mail-subject"
                                type="text"
                                value={emailSettings.mailSubject}
                                onChange={(event) => handleEmailSettingsChange('mailSubject', event.target.value)}
                                className="form-control"
                                maxLength="200"
                            />
                            <small>Variablen: <code>{'{klasse}'}</code> und <code>{'{jahr}'}</code></small>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="mail-text">E-Mail Nachricht</label>
                            <textarea
                                id="mail-text"
                                value={emailSettings.mailText}
                                onChange={(e) => handleEmailSettingsChange('mailText', e.target.value)}
                                className="mail-textarea"
                                placeholder="Verfassen Sie hier Ihre E-Mail-Nachricht..."
                                rows="12"
                            />
                            <div className="mail-char-counter">
                                {emailSettings.mailText.length} Zeichen
                            </div>
                        </div>
                    </div>

                    {/* Send Actions Section */}
                    <div className="send-actions-section">
                        <EmailSummary
                            summary={summary}
                            mode={emailMode}
                        />

                        {/* Copy to Sender Checkbox */}
                        <div className="checkbox-container" style={{ marginBottom: '16px' }}>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={sendCopyToSender}
                                    onChange={(e) => setSendCopyToSender(e.target.checked)}
                                    className="checkbox-input"
                                />
                                <span className="checkbox-text">
                                    📧 Kopie der E-Mails an mich senden
                                </span>
                            </label>
                        </div>

                        <button
                            onClick={handleSendEmails}
                            className="btn send-button btn-success"
                            disabled={isSending}
                        >
                            <span className="button-icon">📤</span>
                            {isSending ? 'E-Mails werden gesendet...' : 'E-Mails jetzt senden'}
                        </button>

                        <SendProgress isLoading={isSending} classCount={summary.sendableClasses} />

                        {sendResult && <div ref={sendResultRef} tabIndex={-1} className={`mail-send-result ${sendResult.results?.failed ? 'has-errors' : 'is-success'}`} aria-live="polite">
                            <div className="mail-send-result-header"><span>{sendResult.results?.failed ? '!' : '✓'}</span><div><strong>{sendResult.results?.failed ? 'Versand teilweise abgeschlossen' : 'Versand abgeschlossen'}</strong><p>{sendResult.message}</p></div></div>
                            <div className="mail-result-counts"><span><strong>{sendResult.results?.successful || 0}</strong> gesendet</span><span><strong>{sendResult.results?.failed || 0}</strong> fehlgeschlagen</span><span><strong>{sendResult.results?.skipped || 0}</strong> übersprungen</span></div>
                            {sendResult.results?.errors?.length > 0 && <details><summary>Fehlerdetails anzeigen</summary><ul>{sendResult.results.errors.map((error) => <li key={error}>{error}</li>)}</ul></details>}
                            {sendResult.results?.skippedDetails?.length > 0 && <details><summary>Übersprungene Klassen anzeigen</summary><ul>{sendResult.results.skippedDetails.map((item) => <li key={`${item.className}-${item.reason}`}><strong>Klasse {item.className}:</strong> {item.reason}</li>)}</ul></details>}
                        </div>}
                    </div>
                </>
            )}

            <BaseDialog
                dialogRef={sendConfirmPopup}
                title="E-Mail Versand bestätigen"
                showDefaultClose={false}
                actions={[
                    {
                        label: 'Abbrechen',
                        position: 'left',
                        onClick: () => sendConfirmPopup.current?.close(),
                    },
                    {
                        label: isSending ? 'Wird gesendet...' : 'E-Mails senden',
                        variant: 'success',
                        onClick: async () => {
                            sendConfirmPopup.current?.close();
                            await executeSendEmails();
                        },
                        disabled: isSending,
                    },
                ]}
            >
                <p>
                    Sie versenden E-Mails an <strong>{summary.sendableRecipients} {emailMode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer'}</strong> für <strong>{summary.sendableClasses} von {summary.totalClasses} Klassen</strong>.
                </p>
                {summary.unassignedClasses.length > 0 ? (
                    <div className="message message-warning">
                        {summary.unassignedClasses.length} Klassen erhalten keine E-Mail: {summary.unassignedClasses.join(', ')}
                    </div>
                ) : null}
                <p className="text-muted">Die erzeugten Excel-Dateien werden direkt an die zugewiesenen Empfänger verschickt.</p>
                {summary.sendableRecipients > summary.sendableClasses && <p className="mail-cc-notice">Mehrere Empfänger derselben Klasse werden gemeinsam angeschrieben und sehen sich gegenseitig im CC.</p>}
            </BaseDialog>
        </div>
    );
}
