import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useGlobalError } from '../../contexts/ErrorContext';

const labels = {
    idle: 'Bereit',
    queued: 'Eingeplant',
    running: 'Läuft',
    succeeded: 'Erfolgreich',
    failed: 'Fehlgeschlagen',
    rolled_back: 'Zurückgerollt',
};

export default function MaintenancePanel({ active }) {
    const { request } = useApi();
    const { showSuccess } = useGlobalError();
    const [status, setStatus] = useState(null);
    const [confirmation, setConfirmation] = useState({ update: '', restart: '' });
    const [submitting, setSubmitting] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const data = await request('/api/systemMaintenance', { showErrorMessage: false });
            setStatus(data);
        } catch {
            // A brief connection loss is expected while the production container restarts.
        }
    }, [request]);

    useEffect(() => {
        if (!active) return undefined;
        refresh();
        const interval = window.setInterval(refresh, 3000);
        return () => window.clearInterval(interval);
    }, [active, refresh]);

    const submit = async (action) => {
        setSubmitting(true);
        try {
            await request('/api/systemMaintenance', {
                method: 'POST',
                data: { action, confirmation: confirmation[action] },
                errorContext: action === 'update' ? 'Beim Starten des Updates' : 'Beim Neustart',
            });
            setConfirmation((current) => ({ ...current, [action]: '' }));
            showSuccess(action === 'update' ? 'Update wurde eingeplant' : 'Neustart wurde eingeplant', 'Systemwartung');
            await refresh();
        } finally {
            setSubmitting(false);
        }
    };

    const busy = submitting || ['queued', 'running'].includes(status?.state);
    return (
        <section className="system-maintenance-card">
            <h3>Systemwartung</h3>
            <div className={`setup-message setup-message--${status?.state === 'failed' ? 'danger' : status?.state === 'succeeded' ? 'success' : 'neutral'}`}>
                <strong>{labels[status?.state] || 'Status wird geladen'}</strong>
                <p>{status?.message || 'Bitte warten…'}</p>
            </div>
            {status?.available ? (
                <div className="system-maintenance-grid">
                    <div>
                        <h4>Update</h4>
                        <p>Backup erstellen, neues Image laden, prüfen und bei Bedarf automatisch zurückrollen.</p>
                        <input className="input" value={confirmation.update} onChange={(event) => setConfirmation((current) => ({ ...current, update: event.target.value }))} placeholder="UPDATE eingeben" disabled={busy} />
                        <button className="btn btn-primary" type="button" onClick={() => submit('update')} disabled={busy || confirmation.update !== 'UPDATE'}>Update installieren</button>
                    </div>
                    <div>
                        <h4>Neustart</h4>
                        <p>Nur den Anwendungscontainer neu starten; Daten und Backups bleiben erhalten.</p>
                        <input className="input" value={confirmation.restart} onChange={(event) => setConfirmation((current) => ({ ...current, restart: event.target.value }))} placeholder="NEUSTART eingeben" disabled={busy} />
                        <button className="btn btn-secondary" type="button" onClick={() => submit('restart')} disabled={busy || confirmation.restart !== 'NEUSTART'}>Anwendung neu starten</button>
                    </div>
                </div>
            ) : (
                <p>Produktionsupdates sind in der Entwicklungsumgebung bewusst deaktiviert.</p>
            )}
            <p className="field-hint">
                Umgebung: {status?.environment === 'production' ? 'Produktion' : 'Entwicklung'} · Internet: {status?.connectivity?.internetConnected ? 'verfügbar' : 'nicht verfügbar'}
            </p>
        </section>
    );
}
