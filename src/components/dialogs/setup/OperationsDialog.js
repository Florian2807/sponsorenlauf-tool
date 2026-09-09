import { useCallback, useEffect, useMemo, useState } from 'react';
import BaseDialog from '../../BaseDialog';
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
    const { request } = useApi();
    const { showSuccess } = useGlobalError();
    const [readiness, setReadiness] = useState(null);
    const [backups, setBackups] = useState([]);
    const [busy, setBusy] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreConfirmation, setRestoreConfirmation] = useState('');
    const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmation: '' });
    const [isOpen, setIsOpen] = useState(false);

    const refresh = useCallback(async () => {
        const [readinessData, backupData] = await Promise.all([
            request('/api/event-readiness', { showErrorMessage: false }),
            request('/api/backups', { showErrorMessage: false }),
        ]);
        setReadiness(readinessData);
        setBackups(backupData.backups || []);
    }, [request]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return undefined;
        const observer = new MutationObserver(() => {
            setIsOpen(dialog.open);
            if (dialog.open) refresh();
        });
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
        return () => observer.disconnect();
    }, [dialogRef, refresh]);

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
        onClick: () => dialogRef.current?.close(),
        disabled: busy,
    }]), [busy, dialogRef]);

    const checkRows = readiness ? [
        ['Datenbank', readiness.checks.database, readiness.database.integrity],
        ['Freier Speicher', readiness.checks.diskSpace, formatBytes(readiness.storage.freeBytes)],
        ['Backup jünger als 24 h', readiness.checks.recentBackup, readiness.backup ? new Date(readiness.backup.createdAt).toLocaleString('de-DE') : 'Kein Backup'],
        ['E-Mail-Versand', readiness.checks.smtp, readiness.smtp.provider === 'microsoft' ? 'Microsoft 365 (OAuth)' : readiness.smtp.host || 'Nicht konfiguriert'],
    ] : [];

    return (
        <BaseDialog dialogRef={dialogRef} title="Veranstaltungsbereitschaft & Sicherheit" actions={actions} showDefaultClose={false} size="xl">
            <div className={`setup-message setup-message--${readiness?.ready ? 'success' : 'warning'}`}>
                {readiness?.ready ? 'Das System ist für die Veranstaltung bereit.' : 'Mindestens ein wichtiger Check benötigt Aufmerksamkeit.'}
            </div>

            <div className="setup-mini-summary">
                {checkRows.map(([label, okay, detail]) => (
                    <div className="setup-mini-summary-card" key={label}>
                        <span>{okay ? '✅' : '⚠️'} {label}</span>
                        <strong>{detail}</strong>
                    </div>
                ))}
            </div>

            <div className="system-maintenance-grid">
                <div className="system-maintenance-card">
                    <h3>Scannerstationen</h3>
                    <p>{readiness?.stations?.length || 0} Station(en) in den letzten 15 Minuten aktiv.</p>
                    <p>Letzter Scan: {readiness?.lastScan ? new Date(readiness.lastScan.timestamp).toLocaleString('de-DE') : 'Noch keiner'}</p>
                    <p>Version: {readiness?.application?.version || '–'}</p>
                </div>

                <div className="system-maintenance-card">
                    <div className="backup-card-header">
                        <div>
                            <h3>Backups</h3>
                            <p>Erstellen, herunterladen oder nicht mehr benötigte Sicherungen löschen.</p>
                        </div>
                        <button className="btn btn-primary" type="button" onClick={createBackup} disabled={busy}>＋ Neues Backup</button>
                    </div>
                    {backups.length === 0 ? (
                        <p className="backup-empty-state">Noch keine Backups vorhanden.</p>
                    ) : (
                        <ul className="backup-list">
                            {backups.map((backup) => (
                                <li className="backup-list-item" key={backup.filename}>
                                    <div className="backup-list-details">
                                        <strong>{new Date(backup.createdAt).toLocaleString('de-DE')}</strong>
                                        <span>{formatBytes(backup.size)}</span>
                                        <small title={backup.filename}>{backup.filename}</small>
                                    </div>
                                    <div className="backup-list-actions">
                                        <button className="btn btn-sm backup-download-button" type="button" onClick={() => downloadBackup(backup.filename)} disabled={busy} aria-label={`Backup vom ${new Date(backup.createdAt).toLocaleString('de-DE')} herunterladen`}>
                                            <span aria-hidden="true">↓</span> Herunterladen
                                        </button>
                                        <button className="btn btn-sm backup-delete-button" type="button" onClick={() => deleteBackup(backup)} disabled={busy} aria-label={`Backup vom ${new Date(backup.createdAt).toLocaleString('de-DE')} löschen`}>
                                            <span aria-hidden="true">🗑</span> Löschen
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="system-maintenance-card">
                    <h3>Backup wiederherstellen</h3>
                    <input type="file" accept=".db,application/vnd.sqlite3" onChange={(event) => setRestoreFile(event.target.files?.[0] || null)} />
                    <p className="field-hint">Zum Bestätigen exakt WIEDERHERSTELLEN eingeben.</p>
                    <input className="input" value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value)} />
                    <button className="btn btn-danger" type="button" onClick={restoreBackup} disabled={busy || !restoreFile || restoreConfirmation !== 'WIEDERHERSTELLEN'}>Backup wiederherstellen</button>
                </div>

                <div className="system-maintenance-card">
                    <h3>Administrator-PIN ändern</h3>
                    <input className="input" type="password" inputMode="numeric" placeholder="Aktuelle PIN" value={pinForm.currentPin} onChange={(event) => setPinForm((current) => ({ ...current, currentPin: event.target.value.replace(/\D/g, '') }))} />
                    <input className="input" type="password" inputMode="numeric" placeholder="Neue PIN" value={pinForm.newPin} onChange={(event) => setPinForm((current) => ({ ...current, newPin: event.target.value.replace(/\D/g, '') }))} />
                    <input className="input" type="password" inputMode="numeric" placeholder="Neue PIN wiederholen" value={pinForm.confirmation} onChange={(event) => setPinForm((current) => ({ ...current, confirmation: event.target.value.replace(/\D/g, '') }))} />
                    <button className="btn btn-primary" type="button" onClick={changePin} disabled={busy || pinForm.newPin.length === 0 || pinForm.newPin !== pinForm.confirmation}>PIN ändern</button>
                </div>
            </div>
            <MaintenancePanel active={isOpen} />
        </BaseDialog>
    );
}
