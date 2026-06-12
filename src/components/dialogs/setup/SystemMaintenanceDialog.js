import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';

const POLL_INTERVAL_MS = 5000;

const formatTimestamp = (value) => {
    if (!value) return 'Noch nie';

    try {
        return new Date(value).toLocaleString('de-DE');
    } catch {
        return value;
    }
};

const statusLabels = {
    idle: 'Bereit',
    queued: 'Eingeplant',
    running: 'Läuft',
    skipped: 'Übersprungen',
    succeeded: 'Erfolgreich',
    failed: 'Fehlgeschlagen',
};

const toneMap = {
    idle: 'neutral',
    queued: 'warning',
    running: 'warning',
    skipped: 'neutral',
    succeeded: 'success',
    failed: 'danger',
};

const SystemMaintenanceDialog = ({ dialogRef }) => {
    const [statusData, setStatusData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { request } = useApi();
    const { showError, showSuccess } = useGlobalError();

    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await request('/api/systemMaintenance', {
                showErrorMessage: false,
            });
            setStatusData(data);
        } catch (error) {
            showError(error, 'Beim Laden des Raspberry-Systemstatus');
        } finally {
            setIsLoading(false);
        }
    }, [request, showError]);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return undefined;
        }

        let intervalId = null;

        const observer = new MutationObserver(() => {
            if (dialog.open) {
                fetchStatus();
                intervalId = window.setInterval(fetchStatus, POLL_INTERVAL_MS);
            } else if (intervalId) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
        });

        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });

        return () => {
            observer.disconnect();
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [dialogRef, fetchStatus]);

    const canRunUpdate = statusData?.canRunUpdate && !['queued', 'running'].includes(statusData?.status?.state);

    const handleUpdateRestart = useCallback(async () => {
        try {
            setIsSubmitting(true);
            await request('/api/systemMaintenance', {
                method: 'POST',
                data: { action: 'update-and-restart' },
                errorContext: 'Beim Einplanen von Update und Neustart',
            });
            showSuccess('Aktualisierung und Neustart wurden eingeplant. Die Verbindung wird gleich kurz unterbrochen.', 'Raspberry-System');
            await fetchStatus();
        } catch {
            // Fehler werden bereits zentral gezeigt.
        } finally {
            setIsSubmitting(false);
        }
    }, [fetchStatus, request, showSuccess]);

    const currentState = statusData?.status?.state || 'idle';
    const currentTone = toneMap[currentState] || 'neutral';
    const currentLabel = statusLabels[currentState] || 'Unbekannt';

    const actions = useMemo(() => ([
        {
            label: 'Schließen',
            position: 'left',
            onClick: () => dialogRef.current?.close(),
            disabled: isSubmitting,
        },
        {
            label: isSubmitting ? 'Plane ein...' : 'Aktualisieren und neu starten',
            variant: 'success',
            onClick: handleUpdateRestart,
            disabled: !canRunUpdate || isSubmitting,
        },
    ]), [canRunUpdate, dialogRef, handleUpdateRestart, isSubmitting]);

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Raspberry Pi Wartung"
            actions={actions}
            showDefaultClose={false}
            size="large"
            className="system-maintenance-dialog"
        >
            <div className="setup-summary-box">
                <strong>Update, Build und Neustart direkt im Frontend</strong>
                <p>Die Aktion startet keinen langen API-Lauf. Stattdessen wird ein Neustart eingeplant, und beim nächsten Service-Start werden automatisch `git pull`, `npm ci` und `npm run build` ausgeführt, sofern LAN und Internet verfügbar sind.</p>
            </div>

            <div className="setup-mini-summary">
                <div className="setup-mini-summary-card">
                    <span>LAN</span>
                    <strong>{statusData?.lanConnected ? 'Verbunden' : 'Nicht verbunden'}</strong>
                </div>
                <div className="setup-mini-summary-card">
                    <span>Internet</span>
                    <strong>{statusData?.internetConnected ? 'Verfügbar' : 'Nicht verfügbar'}</strong>
                </div>
                <div className="setup-mini-summary-card">
                    <span>Status</span>
                    <strong>{currentLabel}</strong>
                </div>
            </div>

            <div className={`setup-message setup-message--${currentTone}`}>
                {statusData?.status?.message || 'Bereit'}
            </div>

            <div className="system-maintenance-grid">
                <div className="system-maintenance-card">
                    <h3>Aktueller Systemstatus</h3>
                    <dl className="system-maintenance-details">
                        <div>
                            <dt>Schnittstelle</dt>
                            <dd>{statusData?.lanInterface || 'eth0'}</dd>
                        </div>
                        <div>
                            <dt>IP-Adressen</dt>
                            <dd>{statusData?.lanAddresses?.length ? statusData.lanAddresses.join(', ') : 'Keine Adresse erkannt'}</dd>
                        </div>
                        <div>
                            <dt>Letzte Anfrage</dt>
                            <dd>{formatTimestamp(statusData?.status?.lastRequestedAt)}</dd>
                        </div>
                        <div>
                            <dt>Letzter erfolgreicher Lauf</dt>
                            <dd>{formatTimestamp(statusData?.status?.lastSuccessfulRunAt)}</dd>
                        </div>
                    </dl>
                </div>

                <div className="system-maintenance-card">
                    <h3>Ablauf beim Neustart</h3>
                    <ul className="system-maintenance-steps">
                        <li>LAN und Internet werden geprüft</li>
                        <li>`git pull --ff-only` wird ausgeführt</li>
                        <li>`npm ci` synchronisiert Abhängigkeiten exakt aus dem Repo</li>
                        <li>`npm run build` erzeugt das neue Build</li>
                        <li>Danach startet `npm start` automatisch neu</li>
                    </ul>
                </div>
            </div>

            <div className="system-maintenance-card">
                <h3>Letzte Log-Zeilen</h3>
                {isLoading && !statusData ? (
                    <p>Status wird geladen...</p>
                ) : (
                    <pre className="system-maintenance-log">
                        {(statusData?.status?.logLines || ['Noch keine Log-Einträge vorhanden.']).join('\n')}
                    </pre>
                )}
            </div>

            {!statusData?.canRunUpdate ? (
                <p className="field-hint">Die Aktion bleibt deaktiviert, solange keine LAN- und Internetverbindung erkannt wird.</p>
            ) : null}
        </BaseDialog>
    );
};

export default SystemMaintenanceDialog;
