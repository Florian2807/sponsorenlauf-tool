import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useGlobalError } from '../../contexts/ErrorContext';
import Checkbox from '../ui/Checkbox';

const labels = { idle: 'Bereit', queued: 'Eingeplant', running: 'Läuft', succeeded: 'Erfolgreich', failed: 'Fehlgeschlagen', rolled_back: 'Zurückgerollt' };
const isRunning = (state) => ['queued', 'running'].includes(state);

export default function MaintenancePanel({ active }) {
    const { request } = useApi();
    const { showSuccess } = useGlobalError();
    const [status, setStatus] = useState(null);
    const [confirmed, setConfirmed] = useState({ update: false, restart: false });
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [logView, setLogView] = useState('progress');
    const mounted = useRef(true);
    const logRef = useRef(null);

    const refresh = useCallback(async () => {
        try {
            const data = await request('/api/systemMaintenance', { showErrorMessage: false });
            if (mounted.current) { setStatus(data); setLoadError(''); }
            return data;
        } catch (error) {
            if (mounted.current) setLoadError(error.message);
            return null;
        }
    }, [request]);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);
    useEffect(() => {
        if (!active) return undefined;
        refresh();
        return undefined;
    }, [active, refresh]);

    useEffect(() => {
        if (!active || !isRunning(status?.state)) return undefined;
        const timer = window.setTimeout(refresh, 3000);
        return () => window.clearTimeout(timer);
    }, [active, refresh, status?.state, status?.updatedAt]);

    useEffect(() => {
        if (logRef.current && isRunning(status?.state)) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [status?.logs, status?.state, logView]);

    const submit = async (action) => {
        setSubmitting(true);
        setLoadError('');
        try {
            const nextStatus = await request('/api/systemMaintenance', {
                method: 'POST',
                data: { action, confirmation: action === 'update' ? 'UPDATE' : 'NEUSTART' },
                errorContext: action === 'update' ? 'Beim Starten des Updates' : 'Beim Neustart',
            });
            setStatus((current) => ({ ...current, ...nextStatus, connectivity: current?.connectivity, logs: current?.logs }));
            setConfirmed((current) => ({ ...current, [action]: false }));
            showSuccess(action === 'update' ? 'Update wurde eingeplant' : 'Neustart wurde eingeplant', 'Systemwartung');
        } catch (error) {
            setLoadError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const busy = submitting || isRunning(status?.state);
    return (
        <section className="system-maintenance-card system-maintenance-panel">
            <div className="system-maintenance-heading">
                <h3>Systemwartung</h3>
                <button className="btn btn-secondary btn-sm" type="button" onClick={refresh} disabled={!active || submitting}>Status prüfen</button>
            </div>
            {loadError && <div className="setup-message setup-message--danger" role="alert">{loadError}</div>}
            <div className={`setup-message setup-message--${status?.state === 'failed' || status?.state === 'rolled_back' ? 'danger' : status?.state === 'succeeded' ? 'success' : 'neutral'}`}>
                <strong>{labels[status?.state] || 'Status wird geladen'}</strong>
                <p>{status?.message || 'Bitte warten…'}</p>
            </div>
            {status?.available ? (
                <div className="system-maintenance-grid system-maintenance-actions">
                    <div>
                        <h4>Update</h4>
                        <p>Erstellt ein Backup, lädt die neue Version und stellt bei einem Fehler den vorherigen Stand wieder her.</p>
                        <Checkbox label="Ich möchte das System jetzt aktualisieren." checked={confirmed.update} onChange={(event) => setConfirmed((current) => ({ ...current, update: event.target.checked }))} disabled={busy} />
                        {!status.connectivity?.internetConnected && <p className="field-hint field-hint--danger">Für das Update wurde keine Internetverbindung erkannt.</p>}
                        <button className="btn btn-primary" type="button" onClick={() => submit('update')} disabled={busy || !confirmed.update || !status.connectivity?.internetConnected}>Update installieren</button>
                    </div>
                    <div>
                        <h4>Neustart</h4>
                        <p>Startet nur die Anwendung neu. Daten und Backups bleiben erhalten.</p>
                        <Checkbox label="Ich möchte die Anwendung jetzt neu starten." checked={confirmed.restart} onChange={(event) => setConfirmed((current) => ({ ...current, restart: event.target.checked }))} disabled={busy} />
                        <button className="btn btn-secondary" type="button" onClick={() => submit('restart')} disabled={busy || !confirmed.restart}>Anwendung neu starten</button>
                    </div>
                </div>
            ) : status ? <p>Produktionsupdates sind in dieser Umgebung nicht verfügbar.</p> : null}
            {status?.available && (status.logs?.progress?.length > 0 || status.logs?.details) && (
                <div className="maintenance-log">
                    <div className="maintenance-log-toolbar">
                        <div className="maintenance-log-tabs" role="tablist" aria-label="Update-Protokoll">
                            <button type="button" role="tab" aria-selected={logView === 'progress'} onClick={() => setLogView('progress')}>Fortschritt</button>
                            <button type="button" role="tab" aria-selected={logView === 'details'} onClick={() => setLogView('details')}>Details</button>
                        </div>
                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigator.clipboard?.writeText(logView === 'progress' ? status.logs.progress.join('\n') : status.logs.details)}>Kopieren</button>
                    </div>
                    <div className="maintenance-log-output" ref={logRef} role="log" aria-live={logView === 'progress' ? 'polite' : 'off'}>
                        {logView === 'progress' ? status.logs.progress.map((line, index) => <div key={`${index}-${line}`}>{line}</div>) : <pre>{status.logs.details || 'Noch keine Befehlsausgabe vorhanden.'}</pre>}
                    </div>
                </div>
            )}
            {status && <p className="field-hint">Umgebung: {status.environment === 'production' ? 'Produktion' : 'Entwicklung'} · Internet: {status.connectivity?.internetConnected ? 'verfügbar' : 'nicht verfügbar'}</p>}
        </section>
    );
}
