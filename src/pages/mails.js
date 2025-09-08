import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { API_ENDPOINTS } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useGlobalError } from '../contexts/ErrorContext';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import SendMailsDialog from '../components/dialogs/mails/SendMailsDialog';
import MailTemplateSelector from '../components/dialogs/mails/MailTemplateSelector';

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
    email: '',
    password: '',
    senderName: 'Schülervertretung',
    emailProvider: 'outlook',
    mailText: EMAIL_TEMPLATES[0].content
};

// ===================================================================
// CUSTOM HOOKS
// ===================================================================
const useConnectivity = () => {
    const [isConnected, setIsConnected] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const { request } = useApi();

    const checkConnectivity = async () => {
        setIsChecking(true);
        try {
            await request('/api/check-connectivity', { timeout: 5000 });
            setIsConnected(true);
        } catch (error) {
            setIsConnected(false);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkConnectivity();
        const interval = setInterval(checkConnectivity, 30000);
        return () => clearInterval(interval);
    }, []);

    return { isConnected, isChecking, checkConnectivity };
};

const useEmailAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authMessage, setAuthMessage] = useState('');
    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();

    const authenticate = async (email, password) => {
        setIsAuthenticating(true);
        setAuthMessage('');

        try {
            const result = await request('/api/mail-auth', {
                method: 'POST',
                data: { email, password },
                errorContext: 'Beim E-Mail-Login'
            });

            if (result.success) {
                setIsAuthenticated(true);
                setAuthMessage('Login erfolgreich');
                showSuccess('Login erfolgreich', 'E-Mail-Authentifizierung');
            } else {
                setAuthMessage('Login fehlgeschlagen: ' + (result.message || 'Unbekannter Fehler'));
                showError('Login fehlgeschlagen', 'E-Mail-Authentifizierung');
            }
        } catch (error) {
            setAuthMessage('Fehler beim Login: ' + (error.message || 'Verbindungsfehler'));
            showError('Fehler beim Login', 'E-Mail-Authentifizierung');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const resetAuth = () => {
        setIsAuthenticated(false);
        setAuthMessage('');
    };

    return { isAuthenticated, isAuthenticating, authMessage, authenticate, resetAuth };
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
                <div className="teacher-count-badge">
                    {validCount} {isManual ? 'E-Mails' : 'Lehrer'}
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

const SendProgress = ({ isLoading, progress }) => {
    if (!isLoading) return null;

    return (
        <div className="send-progress">
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="progress-text">
                {progress}% abgeschlossen
            </div>
        </div>
    );
};

const EmailSummary = ({ summary, mode }) => {
    const { totalClasses, assignedClasses, totalRecipients, unassignedClasses } = summary;
    const recipientType = mode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer';

    return (
        <div className="send-actions">
            <div className="send-preview">
                <span className="preview-icon">📋</span>
                <span>
                    Bereit zum Versenden an <strong>{totalRecipients} {recipientType}</strong> für <strong>{assignedClasses} von {totalClasses} Klassen</strong>
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
    const { isAuthenticated, isAuthenticating, authMessage, authenticate } = useEmailAuth();
    const { files, isGenerating, generateFiles } = useFileGeneration();

    // State
    const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_SETTINGS);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [emailMode, setEmailMode] = useState(config.teachers ? 'teachers' : 'manual');

    // Teacher data
    const [allTeachers, setAllTeachers] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState({});

    // Manual email data
    const [manualEmails, setManualEmails] = useState({});

    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);
    const [sendCopyToSender, setSendCopyToSender] = useState(false);

    // Refs
    const sendMailsPopup = useRef(null);

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

        // Reset authentication if credentials change
        if ((field === 'email' || field === 'password') && isAuthenticated) {
            resetAuth();
        }
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
        if (emailMode === 'teachers') {
            const assignedClasses = availableClasses.filter(className =>
                getAssignedTeachers(className).length > 0
            );
            const totalRecipients = availableClasses.reduce((sum, className) =>
                sum + getAssignedTeachers(className).length, 0
            );

            return {
                totalClasses: availableClasses.length,
                assignedClasses: assignedClasses.length,
                totalRecipients,
                unassignedClasses: availableClasses.filter(className =>
                    getAssignedTeachers(className).length === 0
                )
            };
        } else {
            const assignedClasses = availableClasses.filter(className =>
                getValidEmails(className).length > 0
            );
            const totalRecipients = availableClasses.reduce((sum, className) =>
                sum + getValidEmails(className).length, 0
            );

            return {
                totalClasses: availableClasses.length,
                assignedClasses: assignedClasses.length,
                totalRecipients,
                unassignedClasses: availableClasses.filter(className =>
                    getValidEmails(className).length === 0
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
    const handleSendEmails = async () => {
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

        // Confirmation dialog
        let confirmMessage = `Sie sind dabei, E-Mails an ${summary.totalRecipients} ${emailMode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer'} für ${summary.assignedClasses} von ${summary.totalClasses} Klassen zu senden.`;

        if (summary.unassignedClasses.length > 0) {
            confirmMessage += `\n\nHinweis: ${summary.unassignedClasses.length} Klassen (${summary.unassignedClasses.join(', ')}) haben keine ${emailMode === 'manual' ? 'E-Mail-Adressen' : 'Lehrer'} zugeordnet und erhalten keine E-Mails.`;
        }

        confirmMessage += '\n\nMöchten Sie fortfahren?';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setIsSending(true);
        setSendProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setSendProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const emailData = getEmailData();

            const result = await request('/api/send-mails', {
                method: 'POST',
                data: {
                    teacherEmails: emailData,
                    teacherFiles: files,
                    mailText: emailSettings.mailText,
                    email: emailSettings.email,
                    password: emailSettings.password,
                    senderName: emailSettings.senderName,
                    emailProvider: emailSettings.emailProvider,
                    sendCopyToSender: sendCopyToSender
                },
                errorContext: 'Beim Senden der E-Mails'
            });

            clearInterval(progressInterval);
            setSendProgress(100);

            showSuccess(result.message || 'E-Mails wurden erfolgreich versendet!', 'E-Mail-Versand');

            setTimeout(() => setSendProgress(0), 2000);
        } catch (error) {
            // Error is handled by useApi
        } finally {
            setIsSending(false);
        }
    };

    // Get current summary for display
    const summary = getCurrentSummary();

    return (
        <div className="mail-page-container">
            {/* Header */}
            <div className="mail-header">
                <h1 className="mail-header-title">
                    <span className="header-icon">📧</span>
                    E-Mail Versand System
                </h1>
                <p className="mail-description">
                    Versenden Sie automatisch Excel-Listen mit den Sponsorenlauf-Ergebnissen
                    an die jeweiligen Klassenlehrer. Das System erstellt für jede Klasse
                    eine individuelle Excel-Datei und versendet diese per E-Mail.
                </p>

                {/* Status Overview */}
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
                        <span className="status-label">E-Mail Login:</span>
                        <span className={`status-value ${isAuthenticated ? 'success' : 'pending'}`}>
                            {isAuthenticated ? 'Authentifiziert' : 'Nicht konfiguriert'}
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
                            onClick={() => sendMailsPopup.current.showModal()}
                            disabled={isConnected === false}
                            title={isConnected === false ? 'Internetverbindung erforderlich' : ''}
                        >
                            <span className="button-icon">🚀</span>
                            E-Mail-Versand konfigurieren
                        </button>
                    </div>
                )}
            </div>

            {/* Send Mails Dialog */}
            <SendMailsDialog
                dialogRef={sendMailsPopup}
                fileData={emailSettings}
                setFileData={setEmailSettings}
                credentialsCorrect={isAuthenticated}
                handleLogin={() => authenticate(emailSettings.email, emailSettings.password)}
                status={{
                    loginLoading: isAuthenticating,
                    uploadLoading: isGenerating,
                    loginMessage: authMessage
                }}
                handleUpload={() => {
                    generateFiles();
                    if (sendMailsPopup.current) {
                        sendMailsPopup.current.close();
                    }
                }}
                internetConnected={isConnected}
                connectivityLoading={isChecking}
                checkInternetConnectivity={checkConnectivity}
            />

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

                        {/* Assignment Grid */}
                        <div className="classes-grid">
                            {availableClasses.map(className => (
                                <ClassAssignmentCard
                                    key={className}
                                    className={className}
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

                        <div className="form-group">
                            <textarea
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

                        <SendProgress isLoading={isSending} progress={sendProgress} />
                    </div>
                </>
            )}
        </div>
    );
}
