import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { API_ENDPOINTS, downloadFile } from '../utils/constants';
import { useApi } from '../hooks/useApi';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
import { useGlobalError } from '../contexts/ErrorContext';
import { useModuleConfig } from '../contexts/ModuleConfigContext';
import { useDialogs } from '../hooks/useDialogs';
import GenerateLabelsDialog from '../components/dialogs/setup/GenerateLabelsDialog';
import AdvancedExportDialog from '../components/dialogs/statistics/AdvancedExportDialog';
import DetailedDeleteDialog from '../components/dialogs/setup/DetailedDeleteDialog';
import ClassStructureDialog from '../components/dialogs/setup/ClassStructureDialog';
import CombinedImportDialog from '../components/dialogs/setup/CombinedImportDialog';
import ModuleSettingsDialog from '../components/dialogs/setup/ModuleSettingsDialog';
import OperationsDialog from '../components/dialogs/setup/OperationsDialog';
import SmtpSettingsDialog from '../components/dialogs/setup/SmtpSettingsDialog';
import { PanelNavigationContext } from '../contexts/PanelNavigationContext';
import TeachersPanel from '../components/admin/TeachersPanel';
import MailsPanel from '../components/admin/MailsPanel';
import DonationsEntry from '../components/admin/DonationsEntry';

export default function Setup() {
    const router = useRouter();
    const [replacementAmount, setReplacementAmount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [classStructure, setClassStructure] = useState({});
    const [classStructureLoaded, setClassStructureLoaded] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [panelBusy, setPanelBusy] = useState(false);
    const [visitedViews, setVisitedViews] = useState(['moduleSettings']);
    const [versions, setVersions] = useState({});
    const [editorState, setEditorState] = useState({});
    const [savingEditor, setSavingEditor] = useState(null);
    const editors = useRef(new Map());
    const savingRef = useRef(false);
    const menuButtonRef = useRef(null);
    const validViews = ['moduleSettings', 'classStructure', 'combinedImport', 'generateLabels', 'advancedExport', 'smtpSettings', 'operations', 'detailedDelete', 'teachers', 'mails', 'donations'];
    const activeView = validViews.includes(router.query.view) ? router.query.view : 'moduleSettings';

    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();
    const { isDonationsEnabled, isEmailsEnabled, isTeachersEnabled } = useModuleConfig();
    const { loading, executeAsync } = useAsyncOperation({
        labels: false,
        export: false
    });

    // DOM references for the editors shared with modal screens.
    const { refs: dialogRefs } = useDialogs([
        'generateLabels', 'detailedDelete',
        'classStructure', 'combinedImport', 'moduleSettings', 'smtpSettings', 'operations'
    ]);

    const openDialog = useCallback((view) => {
        setMenuOpen(false);
        return router.push({ pathname: '/setup', query: { view } }, undefined, { shallow: true });
    }, [router]);
    const closeDialog = useCallback(() => {}, []);
    const registerEditor = useCallback((id, editor) => {
        editors.current.set(id, editor);
        setEditorState(current => ({ ...current, [id]: { label: editor.label, view: editor.view, dirty: false, disabled: false } }));
        return () => {
            editors.current.delete(id);
            setEditorState(current => {
                const next = { ...current };
                delete next[id];
                return next;
            });
        };
    }, []);
    const updateEditor = useCallback((id, patch) => {
        setEditorState(current => {
            if (!current[id] || Object.entries(patch).every(([key, value]) => current[id][key] === value)) return current;
            return { ...current, [id]: { ...current[id], ...patch } };
        });
    }, []);
    const dirtyEditors = Object.entries(editorState).filter(([, editor]) => editor.dirty);
    const busy = panelBusy || Boolean(savingEditor);
    const saveEditor = useCallback(async id => {
        const editor = editorState[id];
        if (savingRef.current || !editor?.dirty || editor.disabled) return;
        savingRef.current = true;
        setSavingEditor(id);
        updateEditor(id, { message: '' });
        try {
            const success = await editors.current.get(id)?.save() === true;
            updateEditor(id, success ? { dirty: false, message: 'Änderungen gespeichert.' } : { message: 'Nicht gespeichert. Deine Änderungen bleiben erhalten.' });
        } catch {
            updateEditor(id, { message: 'Nicht gespeichert. Deine Änderungen bleiben erhalten.' });
        } finally { savingRef.current = false; setSavingEditor(null); }
    }, [editorState, updateEditor]);
    const discardEditor = useCallback(id => {
        const view = editorState[id]?.view;
        if (view) setVersions(current => ({ ...current, [view]: (current[view] || 0) + 1 }));
    }, [editorState]);
    const panelNavigation = useMemo(() => ({ persistDrafts: true, hideBack: true, onExit: closeDialog, onBusyChange: setPanelBusy, registerEditor, updateEditor, editorState, saveEditor, discardEditor, openView: openDialog }), [closeDialog, registerEditor, updateEditor, editorState, saveEditor, discardEditor, openDialog]);
    useEffect(() => {
        setVisitedViews(current => current.includes(activeView) ? current : [...current, activeView]);
        if (['teachers', 'mails', 'donations'].includes(activeView)) {
            const frame = requestAnimationFrame(() => {
                const heading = document.querySelector('.setup-view:not([hidden]) .page-title, .setup-view:not([hidden]) .mail-header-title');
                if (heading && !heading.closest('.setup-view').contains(document.activeElement)) { heading.tabIndex = -1; heading.focus(); }
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [activeView]);
    useEffect(() => {
        if (router.isReady && router.query.smtp === '1') openDialog('smtpSettings');
    }, [openDialog, router.isReady, router.query.smtp]);
    useEffect(() => { if (router.query.tour === '1') setMenuOpen(true); }, [router.query.tour]);

    // Fetch-Funktionen mit useCallback für stabile Referenzen
    const fetchClasses = useCallback(async () => {
        try {
            const data = await request('/api/getClasses', { errorContext: 'Beim Abrufen der Klassen' });
            setClasses(data);
            return data;
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
            return null;
        }
    }, [request]);

    const fetchClassStructure = useCallback(async () => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE, { cacheMs: 30000 });
            setClassStructure(data);
            setClassStructureLoaded(true);
            setSelectedClasses(Object.values(data).flat());
        } catch (error) {
            showError(error, 'Beim Abrufen der Klassenstruktur');
        }
    }, [request, showError]);

    useEffect(() => {
        if (activeView === 'generateLabels') fetchClasses();
        if (['classStructure', 'generateLabels'].includes(activeView)) fetchClassStructure();
    }, [activeView, fetchClasses, fetchClassStructure]);

    const handleImportSuccess = (count, type) => {
        fetchClasses(); // Refresh classes in case new ones were added
        showSuccess(`${count} ${type === 'students' ? 'Schüler' : 'Lehrer'} erfolgreich importiert`, 'Daten-Import');
    };

    const handleGenerateLabels = useCallback(async () => {
        const generateOperation = async () => {
            const response = await request(API_ENDPOINTS.GENERATE_LABELS, {
                responseType: 'blob',
                params: {
                    replacementAmount,
                    selectedClasses: selectedClasses.join(',')
                },
                errorContext: 'Beim Generieren der Etiketten'
            });
            return response;
        };

        try {
            const response = await executeAsync(generateOperation, 'labels');
            downloadFile(response, 'labels.pdf');
            showSuccess('Etiketten erfolgreich generiert und heruntergeladen.', 'Etiketten-Generierung');
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    }, [replacementAmount, selectedClasses, request, executeAsync, showSuccess]);

    const handleDeleteSuccess = useCallback(() => {
        fetchClasses();
        fetchClassStructure();
    }, [fetchClasses, fetchClassStructure]);

    const handleExport = useCallback(async (exportData) => {
        try {
            if (exportData.format === 'excel-spenden-klassen') {
                // Für die neue klassenweise Spendenauswertung
                const response = await request('/api/exportSpendenKlassen', {
                    responseType: 'blob'
                });
                downloadFile(response, 'klassenauswertungen_spenden.xlsx');
                showSuccess('Klassenweise Spendenauswertung erfolgreich exportiert');
            } else if (exportData.format === 'html') {
                // Für HTML-Export die bestehende Route verwenden
                const response = await request(API_ENDPOINTS.EXPORT_STATISTICS_HTML, {
                    responseType: 'blob'
                });
                downloadFile(response, 'sponsorenlauf_statistiken_interaktiv.html');
                showSuccess('HTML-Report erfolgreich exportiert');
            } else if (exportData.format === 'excel-complete') {
                // Für Excel-Complete die bestehende Route verwenden
                const response = await request(`${API_ENDPOINTS.EXPORT_EXCEL}?type=complete`, {
                    responseType: 'blob'
                });
                downloadFile(response, 'sponsorenlauf_gesamtauswertung.xlsx');
                showSuccess('Excel-Gesamtauswertung erfolgreich exportiert');
            } else if (exportData.format === 'excel-classes') {
                // Für Excel-Classes die bestehende Route verwenden
                const response = await request(`${API_ENDPOINTS.EXPORT_EXCEL}?type=class-wise`, {
                    responseType: 'blob'
                });
                downloadFile(response, 'sponsorenlauf_klassenweise.zip');
                showSuccess('Excel-Klassendateien erfolgreich exportiert');
            } else {
                // Für andere Formate die neue erweiterte API verwenden
                const response = await request('/api/advancedExport', {
                    method: 'POST',
                    data: exportData,
                    responseType: 'blob'
                });

                let filename = 'sponsorenlauf_export';
                switch (exportData.format) {
                    case 'pdf-summary':
                        filename += '.pdf';
                        break;
                    default:
                        filename += '.html';
                }

                downloadFile(response, filename);
                showSuccess('Export erfolgreich erstellt');
            }

            closeDialog();
        } catch (error) {
            showError(error, 'Beim Export der Auswertung');
        }
    }, [request, showError, showSuccess, closeDialog]);

    const handleExportButtonClick = useCallback(() => {
        openDialog('advancedExport');
    }, [openDialog]);

    const handleClassSelection = (e) => {
        const value = e.target.value;
        setSelectedClasses((prev) =>
            prev.includes(value) ? prev.filter((cls) => cls !== value) : [...prev, value]
        );
    };

    const handleSelectAll = () => {
        setSelectedClasses(classes);
    };

    const handleDeselectAll = () => {
        setSelectedClasses([]);
    };

    const openClassStructurePopup = () => {
        openDialog('classStructure');
    };

    const saveClassStructure = useCallback(async (structure) => {
        try {
            const data = await request(API_ENDPOINTS.CLASS_STRUCTURE, {
                method: 'PUT',
                data: { availableClasses: structure },
                errorContext: 'Beim Speichern der Klassenstruktur'
            });

            if (data.success) {
                setClassStructure(structure);
                setClasses(Object.values(structure).flat());
                setSelectedClasses(Object.values(structure).flat());
                showSuccess('Klassenstruktur erfolgreich gespeichert.', 'Klassenstruktur');
                return true;
            }
        } catch (error) {
            // Fehler wird automatisch über useApi gehandelt
        }
    }, [request, showSuccess]);

    const sections = [
        {
            id: 'configuration', title: 'Lauf einrichten',
            description: 'Funktionen auswählen und den Scanbetrieb vorbereiten.',
            actions: [
                { view: 'moduleSettings', title: 'Module verwalten', description: 'Funktionen und Doppel-Scan-Schutz festlegen.', icon: 'puzzle-piece', tour: 'modules', onClick: () => openDialog('moduleSettings') },
                { view: 'classStructure', title: 'Klassenstruktur', description: 'Jahrgänge und Klassen anlegen.', icon: 'school', tour: 'classes', onClick: openClassStructurePopup, disabled: false },
            ],
        },
        {
            id: 'participants', title: 'Teilnehmer & Etiketten',
            description: 'Daten hinzufügen und Barcodes für den Lauf erstellen.',
            actions: [
                { view: 'combinedImport', title: 'Daten importieren', description: 'Schüler- und Lehrerdaten eingeben oder aus einer Datei laden.', icon: 'file-import', onClick: () => openDialog('combinedImport') },
                ...(isTeachersEnabled ? [{ view: 'teachers', title: 'Lehrer verwalten', icon: 'chalkboard-user', onClick: () => openDialog('teachers') }] : []),
                { view: 'generateLabels', title: 'Etiketten generieren', description: 'Barcode-Etiketten für Schüler und Ersatz-IDs drucken.', icon: 'tags', onClick: () => openDialog('generateLabels'), disabled: loading.labels },
            ],
        },
        {
            id: 'results', title: 'Ergebnisse',
            description: 'Ergebnisse exportieren und weitergeben.',
            actions: [
                { view: 'advancedExport', title: 'Auswertungen exportieren', description: 'Ergebnisse als Datei herunterladen.', icon: 'chart-column', onClick: handleExportButtonClick },
                ...(isDonationsEnabled ? [{ view: 'donations', title: 'Spenden eintragen', icon: 'coins', onClick: () => openDialog('donations') }] : []),
                ...(isEmailsEnabled ? [{ view: 'mails', title: 'Ergebnisse versenden', icon: 'envelope', onClick: () => openDialog('mails') }] : []),
            ],
        },
        {
            id: 'system', title: 'System & Versand',
            description: 'Versand einrichten und den zuverlässigen Betrieb prüfen.',
            actions: [
                { view: 'smtpSettings', title: 'Versand einrichten', description: 'Microsoft 365 oder SMTP einrichten und testen.', icon: 'envelope-open-text', tour: 'smtp', onClick: () => openDialog('smtpSettings') },
                { view: 'operations', title: 'System Check, Backups & Wartung', description: 'System prüfen, Daten sichern und Updates verwalten.', icon: 'shield-halved', tour: 'operations', onClick: () => openDialog('operations') },
            ],
        },
    ];

    const contentFor = view => {
        switch (view) {
            case 'moduleSettings': return <ModuleSettingsDialog dialogRef={dialogRefs.moduleSettingsRef} />;
            case 'classStructure': return classStructureLoaded ? <ClassStructureDialog dialogRef={dialogRefs.classStructureRef} tempClassStructure={classStructure} saveClassStructure={saveClassStructure} /> : <p role="status">Klassenstruktur wird geladen…</p>;
            case 'smtpSettings': return <SmtpSettingsDialog dialogRef={dialogRefs.smtpSettingsRef} />;
            case 'operations': return <OperationsDialog dialogRef={dialogRefs.operationsRef} />;
            case 'teachers': return <PanelNavigationContext.Provider value={null}><TeachersPanel embedded active={activeView === view} /></PanelNavigationContext.Provider>;
            case 'mails': return <PanelNavigationContext.Provider value={null}><MailsPanel embedded active={activeView === view} /></PanelNavigationContext.Provider>;
            case 'donations': return <DonationsEntry />;
            case 'combinedImport': return <CombinedImportDialog dialogRef={dialogRefs.combinedImportRef} onImportSuccess={handleImportSuccess} onClose={closeDialog} />;
            case 'detailedDelete': return <DetailedDeleteDialog dialogRef={dialogRefs.detailedDeleteRef} onDeleteSuccess={handleDeleteSuccess} />;
            case 'advancedExport': return <AdvancedExportDialog onClose={closeDialog} onExport={data => executeAsync(() => handleExport(data), 'export')} showSpendenExport={isDonationsEnabled} loading={loading.export} />;
            case 'generateLabels': return <GenerateLabelsDialog dialogRef={dialogRefs.generateLabelsRef} replacementAmount={replacementAmount} setReplacementAmount={setReplacementAmount} handleSelectAll={handleSelectAll} handleDeselectAll={handleDeselectAll} classes={classes} selectedClasses={selectedClasses} handleClassSelection={handleClassSelection} loading={loading} handleGenerateLabels={handleGenerateLabels} />;
            default: return null;
        }
    };
    const unavailable = view => (view === 'teachers' && !isTeachersEnabled) || (view === 'mails' && !isEmailsEnabled) || (view === 'donations' && !isDonationsEnabled);
    const mountedViews = [...new Set([...visitedViews, activeView])];

    return <div className="app-page page-container-extra-wide setup-dashboard setup-workspace">
        <div className="setup-header">
            <div><h1 className="setup-title">Setup & Verwaltung</h1><p className="setup-subtitle">Einstellungen und Verwaltung an einem Ort.</p></div>
            <div className="setup-workspace-tools">
                <button ref={menuButtonRef} type="button" className="btn btn-secondary setup-menu-toggle" aria-expanded={menuOpen} aria-controls="setup-navigation" disabled={busy} onClick={() => {
                    setMenuOpen(value => !value);
                    if (!menuOpen) requestAnimationFrame(() => document.querySelector('#setup-navigation button:not(:disabled)')?.focus());
                }}><i className="fa-solid fa-bars" aria-hidden="true" /> Bereiche</button>
                <button type="button" className="btn btn-secondary" disabled={busy || dirtyEditors.length > 0} onClick={() => router.push('/setup?tour=1')}><i className="fa-solid fa-compass" aria-hidden="true" /> Einführung starten</button>
            </div>
        </div>
        <span id="setup-unsaved-description" className="sr-only">Ungespeicherte Änderungen</span>
        <div className="setup-workspace-layout">
            <nav id="setup-navigation" className={`setup-workspace-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Setup-Bereiche" onKeyDown={event => {
                if (event.key === 'Escape' && menuOpen) { event.preventDefault(); setMenuOpen(false); menuButtonRef.current?.focus(); }
            }}>
                {sections.map(section => <div className="setup-nav-group" key={section.id}>
                    <h2>{section.title}</h2>
                    {section.actions.map(action => <button type="button" key={action.title} disabled={busy || action.disabled} aria-current={activeView === action.view ? 'page' : undefined} aria-describedby={Object.values(editorState).some(editor => editor.view === action.view && editor.dirty) ? 'setup-unsaved-description' : undefined} onClick={action.onClick} data-tour={action.tour}>
                        <i className={`fa-solid fa-${action.icon}`} aria-hidden="true" /><span>{action.title}</span>{Object.values(editorState).some(editor => editor.view === action.view && editor.dirty) && <span className="setup-nav-dirty" aria-hidden="true" />}
                    </button>)}
                </div>)}
                <div className="setup-nav-group setup-nav-cleanup"><h2>Daten bereinigen</h2><button type="button" disabled={busy} aria-current={activeView === 'detailedDelete' ? 'page' : undefined} onClick={() => openDialog('detailedDelete')}><i className="fa-solid fa-trash-can" aria-hidden="true" /> Daten löschen</button></div>
            </nav>
            <div className="setup-workspace-content" inert={Boolean(savingEditor)} aria-busy={busy} onChangeCapture={() => {
                if (['moduleSettings', 'classStructure', 'smtpSettings'].includes(activeView)) updateEditor(activeView, { dirty: true, message: '' });
            }} onClickCapture={event => {
                const changesClasses = activeView === 'classStructure' && event.target.closest('.structure-grade-list button, .class-structure-dialog .settings-section-heading button');
                const changesProvider = activeView === 'smtpSettings' && event.target.closest('.smtp-provider-clean');
                if (changesClasses || changesProvider) { updateEditor(activeView, { dirty: true, message: '' }); }
            }}>
                {mountedViews.map(view => <div key={`${view}-${versions[view] || 0}`} hidden={activeView !== view} className="setup-view" data-setup-panel={view}>
                    <PanelNavigationContext.Provider value={{ ...panelNavigation, active: activeView === view, viewId: view }}>
                        {unavailable(view) ? <p className="message message-info">Dieses Modul ist deaktiviert. Aktiviere es unter „Module verwalten“.</p> : contentFor(view)}
                    </PanelNavigationContext.Provider>
                </div>)}
            </div>
        </div>
    </div>;
}
