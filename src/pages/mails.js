import { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import BaseDialog from '../components/BaseDialog';
import MailTemplateSelector from '../components/dialogs/mails/MailTemplateSelector';
import { matchClassName } from '../utils/importHelpers';

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
const useConnectivity = () => {
    const [isConnected, setIsConnected] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const { request } = useApi();

    const checkConnectivity = useCallback(async () => {
        setIsChecking(true);
        try {
            const result = await request('/api/check-connectivity', { timeout: 5000 });
            setIsConnected(Boolean(result?.connected));
        } catch (error) {
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    }, [request]);

    useEffect(() => {
        checkConnectivity();
        const interval = setInterval(checkConnectivity, 30000);
        return () => clearInterval(interval);
    }, [checkConnectivity]);

    return { isConnected, isChecking, checkConnectivity };
};

const useSmtpConfiguration = (setEmailSettings) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { request } = useApi();

    useEffect(() => {
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
    }, [request, setEmailSettings]);

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
// EMAIL RECIPIENT MANAGERS
// ===================================================================
class TeacherManager {
    constructor(availableClasses = []) {
        this.allTeachers = [];
        this.assignments = {};
        this.availableClasses = availableClasses;
        this.initializeAssignments();
    }

    initializeAssignments() {
        this.assignments = {};
        this.availableClasses.forEach(className => {
            this.assignments[className] = [];
        });
    }

    setTeachers(teachers) {
        this.allTeachers = teachers;
        this.assignExistingTeachers(teachers);
    }

    assignExistingTeachers(teachers) {
        teachers.forEach(teacher => {
            if (this.assignments[teacher.klasse]) {
                this.assignments[teacher.klasse].push({
                    id: teacher.id,
                    name: `${teacher.nachname}, ${teacher.vorname}`,
                    email: teacher.email
                });
            }
        });
    }

    addTeacherSlot(className) {
        if (this.assignments[className]) {
            this.assignments[className].push({ id: null, name: null, email: '' });
        }
    }

    removeTeacherSlot(className, index) {
        if (this.assignments[className] && this.assignments[className].length > 0) {
            this.assignments[className].splice(index, 1);
        }
    }

    assignTeacher(className, index, teacherId) {
        if (!this.assignments[className]) return;

        if (!teacherId) {
            this.assignments[className][index] = { id: null, name: null, email: '' };
        } else {
            const teacher = this.allTeachers.find(t => t.id === teacherId);
            if (teacher) {
                this.assignments[className][index] = {
                    id: teacher.id,
                    name: `${teacher.nachname}, ${teacher.vorname}`,
                    email: teacher.email
                };
            }
        }
    }

    getAssignments() {
        return this.assignments;
    }

    getAssignedTeachers(className) {
        return this.assignments[className] || [];
    }

    getEmailData() {
        const emailData = {};
        Object.keys(this.assignments).forEach(className => {
            const assignedTeachers = this.assignments[className].filter(teacher => teacher.id);
            if (assignedTeachers.length > 0) {
                emailData[className] = assignedTeachers;
            }
        });
        return emailData;
    }

    getSummary() {
        const assignedClasses = Object.keys(this.assignments).filter(
            className => this.assignments[className].some(teacher => teacher.id)
        );
        const totalRecipients = Object.values(this.assignments)
            .flat()
            .filter(teacher => teacher.id).length;

        return {
            totalClasses: this.availableClasses.length,
            assignedClasses: assignedClasses.length,
            totalRecipients,
            unassignedClasses: this.availableClasses.filter(
                className => !assignedClasses.includes(className)
            )
        };
    }
}

class ManualEmailManager {
    constructor(availableClasses = []) {
        this.emails = {};
        this.availableClasses = availableClasses;
        this.initializeEmails();
    }

    initializeEmails() {
        this.emails = {};
        this.availableClasses.forEach(className => {
            this.emails[className] = [];
        });
    }

    addEmailField(className) {
        if (this.emails[className]) {
            this.emails[className].push('');
        }
    }

    removeEmailField(className, index) {
        if (this.emails[className] && this.emails[className].length > 0) {
            this.emails[className].splice(index, 1);
        }
    }

    updateEmail(className, index, email) {
        if (this.emails[className]) {
            this.emails[className][index] = email.trim();
        }
    }

    getEmails() {
        return this.emails;
    }

    getClassEmails(className) {
        return this.emails[className] || [];
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getValidEmails(className) {
        return this.getClassEmails(className).filter(email =>
            email && email.trim() && this.validateEmail(email.trim())
        );
    }

    getEmailData() {
        const emailData = {};
        Object.keys(this.emails).forEach(className => {
            const validEmails = this.getValidEmails(className);
            if (validEmails.length > 0) {
                emailData[className] = validEmails.map((email, index) => ({
                    id: `manual-${index}`,
                    email: email.trim(),
                    name: `Manuell eingegebene E-Mail ${index + 1}`
                }));
            }
        });
        return emailData;
    }

    getSummary() {
        const assignedClasses = Object.keys(this.emails).filter(
            className => this.getValidEmails(className).length > 0
        );
        const totalRecipients = Object.values(this.emails)
            .map(emails => this.getValidEmails('').length)
            .reduce((sum, count) => sum + count, 0);

        // Fix: Korrekte Berechnung der totalRecipients
        const totalValidRecipients = Object.keys(this.emails)
            .reduce((sum, className) => sum + this.getValidEmails(className).length, 0);

        return {
            totalClasses: this.availableClasses.length,
            assignedClasses: assignedClasses.length,
            totalRecipients: totalValidRecipients,
            unassignedClasses: this.availableClasses.filter(
                className => !assignedClasses.includes(className)
            )
        };
    }
}

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
                    ✅ Internet verfügbar
                </span>
            ) : isConnected === false ? (
                <span className="connectivity-badge disconnected">
                    ❌ Keine Internetverbindung
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
                title="Internetverbindung erneut prüfen"
            >
                🔄
            </button>
        </div>

        {isConnected === false && (
            <div className="connectivity-warning-compact">
                ⚠️ E-Mail-Versand nicht möglich ohne Internetverbindung
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
export default function MailsPage() {
    // Hooks
    const { config } = useModuleConfig();
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { isConnected, isChecking, checkConnectivity } = useConnectivity();
    const { files, isGenerating, generateFiles } = useFileGeneration();

    // State
    const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_SETTINGS);
    const { isAuthenticated } = useSmtpConfiguration(setEmailSettings);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [emailMode, setEmailMode] = useState(config.teachers ? 'teachers' : 'manual');

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

    // Initialize data when component mounts
    useEffect(() => {
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

                setTeacherAssignments(initialTeacherAssignments);
                setManualEmails(initialManualEmails);

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

                    setTeacherAssignments(updatedAssignments);
                }
            } catch (error) {
                showError(error, 'Beim Laden der Daten');
            }
        };

        initializeData();
    }, [config.teachers, request, showError]);

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
            const emptyTeachers = classTeachers.filter(t => !t.id);

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
            const emptyEmails = classEmails.filter(e => !e || !e.trim());

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
        <div className="mail-page-container">
            {/* Header */}
            <div className="mail-header">
                <h1 className="mail-header-title" data-tour="mail">
                    <span className="header-icon">📧</span>
                    E-Mail Versand System
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
                        <span className="status-icon">🌐</span>
                        <span className="status-label">Internetverbindung:</span>
                        <span className={`status-value ${isConnected ? 'success' : 'error'}`}>
                            {isChecking ? 'Prüfe...' : (isConnected ? 'Verfügbar' : 'Nicht verfügbar')}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-icon">🔐</span>
                        <span className="status-label">E-Mail-Versand:</span>
                        <span className={`status-value ${isAuthenticated ? 'success' : 'pending'}`}>
                            {isAuthenticated
                                ? (emailSettings.provider === 'microsoft' ? 'Microsoft 365 (OAuth)' : 'SMTP konfiguriert')
                                : 'Nicht konfiguriert'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-icon">📁</span>
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
                            className={`btn btn-lg mail-start-button ${isConnected === false ? 'btn-disabled' : 'btn-primary'}`}
                            onClick={() => isAuthenticated ? generateFiles() : window.location.assign('/setup?smtp=1')}
                            disabled={isConnected === false || isGenerating}
                            title={isConnected === false ? 'Internetverbindung erforderlich' : ''}
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
                            <span className="title-icon">👥</span>
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
                            currentText={emailSettings.mailText}
                            onChange={(text) => handleEmailSettingsChange('mailText', text)}
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
                            className={`btn send-button ${isConnected === false ? 'btn-secondary' : 'btn-success'}`}
                            disabled={isSending || isConnected === false}
                            title={isConnected === false ? 'Internetverbindung erforderlich' : ''}
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
