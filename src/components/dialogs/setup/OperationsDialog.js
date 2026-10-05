import { useCallback, useEffect, useMemo, useState } from 'react';
import BaseDialog from '../../BaseDialog';
import { usePanelPresentation } from '../../../contexts/PanelNavigationContext';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { downloadFile } from '../../../utils/constants';
import MaintenancePanel from '../../setup/MaintenancePanel';

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return 'Unbekannt';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
    return `${value.toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
});

export default function OperationsDialog({ dialogRef }) {
    const { inline, closePanel, navigation } = usePanelPresentation(dialogRef);
    const active = navigation?.active !== false;
    const { request } = useApi();
    const { showSuccess } = useGlobalError();
    const [panel, setPanel] = useState('readiness');
    const [loadError, setLoadError] = useState('');
    const [readiness, setReadiness] = useState(null);
    const [backups, setBackups] = useState([]);
    const [busy, setBusy] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreConfirmation, setRestoreConfirmation] = useState('');
    const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmation: '' });
    const [isOpen, setIsOpen] = useState(false);

    const refresh = useCallback(async () => {
        setLoadError('');
        try {
            const [readinessData, backupData] = await Promise.all([
                request('/api/event-readiness', { showErrorMessage: false }),
                request('/api/backups', { showErrorMessage: false }),
            ]);
            setReadiness(readinessData);
            setBackups(backupData.backups || []);
        } catch (error) { setLoadError(error.message || 'Systemstatus konnte nicht geladen werden.'); }
    }, [request]);

    useEffect(() => {
        if (inline) { setIsOpen(active); if (active) refresh(); return undefined; }
        const dialog = dialogRef.current;
        if (!dialog) return undefined;
        const observer = new MutationObserver(() => {
            setIsOpen(dialog.open);
            if (dialog.open) { setPanel('readiness'); refresh(); }
        });
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
        return () => observer.disconnect();
    }, [dialogRef, refresh, inline, active]);

    const createBackup = async () => {
        setBusy(true);
        try {
            const backup = await request('/api/backups', { method: 'POST', data: { action: 'create' } });
            showSuccess(`Backup erstellt: ${backup.filename}`, 'Datensicherung');
            await refresh();
        } finally { setBusy(false); }
    };

    const downloadBackup = async (filename) => {
        const blob = await request(`/api/backups?filename=${encodeURIComponent(filename)}`, { responseType: 'blob' });
        downloadFile(blob, filename);
    };

    const deleteBackup = async (backup) => {
        const createdAt = new Date(backup.createdAt).toLocaleString('de-DE');
        if (!window.confirm(`Backup vom ${createdAt} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;

        setBusy(true);
        try {
            await request('/api/backups', {
                method: 'POST',
                data: { action: 'delete', filename: backup.filename },
            });
            showSuccess('Backup erfolgreich gelöscht', 'Datensicherung');
            await refresh();
        } finally { setBusy(false); }
    };

    const restoreBackup = async () => {
        if (!restoreFile || restoreConfirmation !== 'WIEDERHERSTELLEN') return;
        setBusy(true);
        try {
            const result = await request('/api/backups', {
                method: 'POST',
                data: { action: 'restore', base64: await fileToBase64(restoreFile) },
                timeout: 120000,
            });
            showSuccess(`Backup wiederhergestellt. Sicherheitskopie: ${result.safetyBackup}`, 'Wiederherstellung');
            setRestoreFile(null);
            setRestoreConfirmation('');
            await refresh();
        } finally { setBusy(false); }
    };

    const changePin = async () => {
        setBusy(true);
        try {
            await request('/api/admin-auth', { method: 'POST', data: { action: 'change-pin', ...pinForm } });
            setPinForm({ currentPin: '', newPin: '', confirmation: '' });
            showSuccess('Administrator-PIN geändert', 'Sicherheit');
        } finally { setBusy(false); }
    };

    const actions = useMemo(() => ([{
        label: 'Schließen',
        cancel: true, variant: 'secondary',
        onClick: () => closePanel(),
        disabled: busy,
    }]), [busy, closePanel]);

    const checkRows = readiness ? [
        ['Datenbank', readiness.checks.database, readiness.database.backend === 'postgres' ? 'PostgreSQL' : readiness.database.backend],
        ['Freier Speicher', readiness.checks.diskSpace, formatBytes(readiness.storage.freeBytes)],
        ['E-Mail-Versand', readiness.checks.smtp, readiness.smtp.provider === 'microsoft' ? 'Microsoft 365 (OAuth)' : readiness.smtp.host || 'Nicht konfiguriert'],
    ] : [];

    const sections = [['readiness', 'System Check', 'clipboard-check'], ['backups', 'Backups', 'database'], ['maintenance', 'Wartung', 'screwdriver-wrench'], ['security', 'Sicherheit', 'shield-halved']];

    return <BaseDialog dialogRef={dialogRef} title="System Check, Backups & Wartung" actions={actions} showDefaultClose={false} size="xl" className="operations-dialog">
        <nav className="settings-section-nav" aria-label="Systembereiche">
            {sections.map(([key, label, icon]) => <button key={key} type="button" aria-pressed={panel === key} onClick={() => setPanel(key)}><i className={`fa-solid fa-${icon}`} aria-hidden="true" />{label}</button>)}
        </nav>
        {loadError && <p className="message message-error" role="alert">{loadError}</p>}
        {panel === 'readiness' && <section className="operations-section">
            <div className="settings-section-heading"><div><h3>Bereit für den Lauf?</h3><p>Prüfe die wichtigsten Voraussetzungen vor dem Start.</p></div><button className="btn btn-secondary btn-sm" type="button" onClick={refresh} disabled={busy}>Erneut prüfen</button></div>
            {!readiness ? <p className="settings-empty-copy" role="status">Systemstatus wird geladen…</p> : <>
                <p className={`message ${readiness.ready ? 'message-success' : 'message-warning'}`}>{readiness.ready ? 'Das System ist für die Veranstaltung bereit.' : 'Einige Voraussetzungen benötigen noch Aufmerksamkeit.'}</p>
                <div className="readiness-check-list">
                    {checkRows.map(([label, okay, detail]) => <div key={label} className="readiness-check"><i className={`fa-solid fa-${okay ? 'circle-check' : 'circle-exclamation'} ${okay ? 'check-success' : 'check-warning'}`} aria-hidden="true" /><div><strong>{label}</strong><span>{detail}</span></div><span className={okay ? 'check-success' : 'check-warning'}>{okay ? 'Bereit' : 'Prüfen'}</span></div>)}
                </div>
                <p className="field-hint">Letztes Backup: {readiness.backup ? new Date(readiness.backup.createdAt).toLocaleString('de-DE') : 'Noch keines vorhanden'}</p>
                <div className="operations-station-summary"><h4>Scanner & Anwendung</h4><p>{readiness.stations?.length || 0} Station(en) in den letzten 15 Minuten aktiv.</p><p>Letzter Scan: {readiness.lastScan ? new Date(readiness.lastScan.timestamp).toLocaleString('de-DE') : 'Noch keiner'} · Version {readiness.application?.version || '–'}</p></div>
            </>}
        </section>}
        {panel === 'backups' && <section className="operations-section">
            <div className="settings-section-heading"><div><h3>Datensicherungen</h3><p>Erstellen und herunterladen, bevor du größere Änderungen vornimmst.</p></div><button className="btn btn-primary" type="button" onClick={createBackup} disabled={busy}><i className="fa-solid fa-plus" aria-hidden="true" /> Neues Backup</button></div>
            {!backups.length ? <p className="empty-state">Noch keine Backups vorhanden.</p> : <ul className="backup-list">
                {backups.map(backup => <li className="backup-list-item" key={backup.filename}>
                    <div className="backup-list-details"><strong>{new Date(backup.createdAt).toLocaleString('de-DE')}</strong><span>{formatBytes(backup.size)}</span><small title={backup.filename}>{backup.filename}</small></div>
                    <div className="backup-list-actions"><button className="btn btn-secondary btn-sm" type="button" onClick={() => downloadBackup(backup.filename)} disabled={busy} aria-label={`Backup vom ${new Date(backup.createdAt).toLocaleString('de-DE')} herunterladen`}><i className="fa-solid fa-download" aria-hidden="true" /> Herunterladen</button><button className="btn btn-danger btn-sm" type="button" onClick={() => deleteBackup(backup)} disabled={busy} aria-label={`Backup vom ${new Date(backup.createdAt).toLocaleString('de-DE')} löschen`}><i className="fa-solid fa-trash" aria-hidden="true" /></button></div>
                </li>)}
            </ul>}
            <details className="operations-restore"><summary>Backup wiederherstellen</summary><div className="settings-form-stack">
                <p className="field-hint">Ersetzt die aktuellen Daten durch das Backup. Vorher wird eine Sicherheitskopie erstellt.</p>
                <label htmlFor="restore-file">Backup-Datei</label><input id="restore-file" type="file" accept=".db,.dump,application/vnd.sqlite3,application/octet-stream" onChange={event => setRestoreFile(event.target.files?.[0] || null)} disabled={busy} />
                <label htmlFor="restore-confirmation">Zum Bestätigen WIEDERHERSTELLEN eingeben</label><input id="restore-confirmation" className="input" value={restoreConfirmation} onChange={event => setRestoreConfirmation(event.target.value)} disabled={busy} autoComplete="off" />
                <button className="btn btn-danger" type="button" onClick={restoreBackup} disabled={busy || !restoreFile || restoreConfirmation !== 'WIEDERHERSTELLEN'}>Backup wiederherstellen</button>
            </div></details>
        </section>}
        {panel === 'maintenance' && <MaintenancePanel active={isOpen && panel === 'maintenance'} />}
        {panel === 'security' && <section className="operations-section">
            <div className="settings-section-heading"><div><h3>Administrator-PIN ändern</h3><p>Schützt Einstellungen und Verwaltungsfunktionen.</p></div></div>
            <form className="settings-form-stack operations-pin-form" onSubmit={event => { event.preventDefault(); if (!busy && pinForm.newPin && pinForm.newPin === pinForm.confirmation) changePin(); }} onKeyDownCapture={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.requestSubmit(); } }}>
                {[['currentPin', 'Aktuelle PIN'], ['newPin', 'Neue PIN'], ['confirmation', 'Neue PIN wiederholen']].map(([key, label]) => <label key={key} htmlFor={`operations-${key}`}><span>{label}</span><input id={`operations-${key}`} className="input" type="password" inputMode="numeric" autoComplete={key === 'currentPin' ? 'current-password' : 'new-password'} required value={pinForm[key]} onChange={event => setPinForm(current => ({ ...current, [key]: event.target.value.replace(/\D/g, '') }))} disabled={busy} /></label>)}
                <button className="btn btn-primary" type="submit" disabled={busy || !pinForm.currentPin || !pinForm.newPin || pinForm.newPin !== pinForm.confirmation}>PIN ändern</button>
            </form>
        </section>}
    </BaseDialog>;
}
