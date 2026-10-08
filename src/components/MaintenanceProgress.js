import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { readMaintenanceStatus } from '../utils/clientRequests';
import useNotificationPopover from './NotificationPopover';

const STORAGE_KEY = 'sponsorenlauf-maintenance-progress';
const EVENT_NAME = 'sponsorenlauf-maintenance-started';
const FINISHED = new Set(['succeeded', 'failed', 'rolled_back', 'unconfirmed']);
const CONFIRMED_WAIT_LIMIT = 2 * 60 * 60 * 1000;

const unconfirmedStatus = (current) => ({
    ...current,
    state: 'unconfirmed',
    message: 'Der Wartungsstatus konnte nicht bestätigt werden. Bitte den Systemstatus prüfen.',
});

export const trackMaintenance = (status) => {
    const operation = {
        action: status.action,
        requestId: status.requestId || null,
        state: status.state || 'queued',
        message: status.message || 'Wartungsaktion wird geprüft.',
        startedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(operation));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: operation }));
};

export default function MaintenanceProgress() {
    const [operation, setOperation] = useState(null);
    const [connectionLost, setConnectionLost] = useState(false);
    const [popoverRef, dialog] = useNotificationPopover(Boolean(operation));
    const action = operation?.action;
    const requestId = operation?.requestId;
    const state = operation?.state;
    const startedAt = operation?.startedAt;

    useEffect(() => {
        try {
            const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
            if (stored && ['update', 'restart'].includes(stored.action)) setOperation(stored);
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
        }
        const handleStart = (event) => {
            setConnectionLost(false);
            setOperation(event.detail);
        };
        window.addEventListener(EVENT_NAME, handleStart);
        return () => window.removeEventListener(EVENT_NAME, handleStart);
    }, []);

    useEffect(() => {
        if (!action || FINISHED.has(state)) return undefined;
        let cancelled = false;
        let timer;
        const poll = async () => {
            try {
                const status = await readMaintenanceStatus();
                if (cancelled) return;
                setConnectionLost(false);
                if (status.requestId && (status.requestId === requestId || !requestId && status.action === action)) {
                    setOperation((current) => {
                        const next = { ...current, requestId: status.requestId, state: status.state, message: status.message };
                        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                        return next;
                    });
                } else if (Date.now() - startedAt > (requestId ? CONFIRMED_WAIT_LIMIT : 30000)) {
                    setOperation((current) => {
                        const next = unconfirmedStatus(current);
                        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                        return next;
                    });
                }
            } catch {
                if (!cancelled) {
                    setConnectionLost(true);
                    if (Date.now() - startedAt > (requestId ? CONFIRMED_WAIT_LIMIT : 30000)) {
                        setOperation((current) => {
                            const next = unconfirmedStatus(current);
                            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                            return next;
                        });
                    }
                }
            }
            if (!cancelled) timer = window.setTimeout(poll, 3000);
        };
        poll();
        return () => { cancelled = true; window.clearTimeout(timer); };
    }, [action, requestId, state, startedAt]);

    if (!operation) return null;
    const finished = FINISHED.has(operation.state);
    const succeeded = operation.state === 'succeeded';
    const title = operation.action === 'update' ? 'Update' : 'Neustart';
    const dismiss = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setOperation(null);
    };

    return createPortal(
        <aside ref={popoverRef} popover="manual" className={`maintenance-progress ${finished ? succeeded ? 'success' : 'failure' : ''}`} role="status" aria-live="polite">
            <div className="maintenance-progress-heading">
                <span className={`maintenance-progress-icon ${finished ? '' : 'busy'}`} aria-hidden="true">{finished ? succeeded ? '✓' : '!' : '↻'}</span>
                <strong>{title}: {operation.state === 'unconfirmed' ? 'Status unklar' : finished ? succeeded ? 'abgeschlossen' : 'fehlgeschlagen' : operation.state === 'queued' ? 'eingeplant' : 'läuft'}</strong>
                {finished && <button type="button" onClick={dismiss} aria-label="Wartungsstatus schließen">×</button>}
            </div>
            <p>{connectionLost && !finished ? 'Verbindung unterbrochen. Warte auf die Anwendung…' : operation.message}</p>
            {!finished && <div className="maintenance-progress-track" role="progressbar" aria-label={`${title} läuft`}><span /></div>}
            <style jsx>{`
                .maintenance-progress {
                    position: fixed;
                    inset: auto;
                    bottom: 20px;
                    right: 20px;
                    width: min(380px, calc(100vw - 32px));
                    margin: 0;
                    padding: 16px;
                    border: 1px solid var(--ui-accent);
                    border-radius: 10px;
                    background: var(--ui-surface);
                    color: var(--ui-text);
                    box-shadow: var(--ui-dialog-shadow);
                    z-index: 10000;
                }
                .maintenance-progress.success { border-color: var(--ui-success); }
                .maintenance-progress.failure { border-color: var(--ui-danger); }
                .maintenance-progress-heading { display: flex; align-items: center; gap: 10px; }
                .maintenance-progress-heading strong { flex: 1; }
                .maintenance-progress-heading button { border: 0; background: none; color: inherit; font-size: 22px; cursor: pointer; }
                .maintenance-progress-icon { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--ui-accent); }
                .maintenance-progress-icon.busy { animation: maintenance-spin 1.2s linear infinite; }
                .success .maintenance-progress-icon { background: var(--ui-success); }
                .failure .maintenance-progress-icon { background: var(--ui-danger); }
                .maintenance-progress p { margin: 10px 0 0; color: inherit; line-height: 1.4; }
                .maintenance-progress-track { height: 4px; margin-top: 14px; overflow: hidden; border-radius: 4px; background: var(--ui-border); }
                .maintenance-progress-track span { display: block; width: 35%; height: 100%; border-radius: inherit; background: var(--ui-accent); animation: maintenance-slide 1.5s ease-in-out infinite alternate; }
                @keyframes maintenance-spin { to { transform: rotate(360deg); } }
                @keyframes maintenance-slide { to { transform: translateX(185%); } }
                @media (max-width: 480px) { .maintenance-progress { left: 16px; right: 16px; bottom: 16px; width: auto; } }
                @media (prefers-reduced-motion: reduce) { .maintenance-progress-icon.busy, .maintenance-progress-track span { animation: none; } }
            `}</style>
        </aside>,
        dialog || document.body
    );
}
