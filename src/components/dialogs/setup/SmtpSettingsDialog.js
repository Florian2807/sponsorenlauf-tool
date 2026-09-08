import { useEffect, useMemo, useRef, useState } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';

const PROVIDERS = {
    smtp: { label: 'SMTP-Mailserver', description: 'z. B. von Ihrem Webhosting' },
    microsoft: { label: 'Microsoft 365', description: 'via Microsoft Graph API' },
};

const EMPTY_CONFIGURATION = {
    provider: 'smtp', host: '', port: 587, security: 'starttls', username: '', password: '', passwordConfigured: false,
    tenantId: '', clientId: '', clientSecret: '', clientSecretConfigured: false,
    fromAddress: '', fromName: 'Schülervertretung',
};

function SetupGuideDialog({ dialogRef, provider }) {
    return (
        <BaseDialog dialogRef={dialogRef} title={provider === 'microsoft' ? 'Microsoft 365 einrichten' : 'SMTP-Mailserver einrichten'} size="large">
            <div className="smtp-guide-clean">
                {provider === 'microsoft' ? <>
                    <p>Diese Verbindung nutzt Microsoft Graph und funktioniert mit Zwei-Faktor-Authentifizierung. Sie benötigen Administratorzugriff auf Microsoft Entra.</p>
                    <div className="smtp-tutorial-video">
                        <video controls preload="metadata">
                            <source src="/tutorials/microsoft-365-einrichtung.mp4" type="video/mp4" />
                            Ihr Browser unterstützt die Videowiedergabe nicht.
                        </video>
                    </div>
                    <ol>
                        <li><strong>App registrieren:</strong> Öffnen Sie Microsoft Entra und wählen Sie „App-Registrierungen → Neue Registrierung“. Vergeben Sie einen Namen und lassen Sie die Umleitungs-URI leer.</li>
                        <li><strong>IDs übernehmen:</strong> Kopieren Sie die „Anwendungs-ID (Client)“ und die „Verzeichnis-ID (Mandant)“ aus der Übersicht.</li>
                        <li><strong>Secret erstellen:</strong> Öffnen Sie „Zertifikate & Geheimnisse → Neuer geheimer Clientschlüssel“. Kopieren Sie sofort den angezeigten <em>Wert</em>, nicht die Secret-ID.</li>
                        <li><strong>Berechtigung hinzufügen:</strong> Öffnen Sie „API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Anwendungsberechtigungen“ und aktivieren Sie <code>Mail.Send</code>.</li>
                        <li><strong>Zustimmung erteilen:</strong> Klicken Sie auf „Administratorzustimmung für … erteilen“. Ohne diesen Schritt kann Microsoft keine E-Mail versenden.</li>
                        <li><strong>Zugriff begrenzen:</strong> Beschränken Sie die App möglichst per Exchange Application RBAC auf das verwendete Absenderpostfach.</li>
                        <li><strong>Testen:</strong> Der Versandtest sendet eine echte E-Mail an das eingetragene Absenderpostfach.</li>
                    </ol>
                    <div className="smtp-guide-clean-note">Notieren Sie das Ablaufdatum des Client-Secrets. Nach Ablauf muss ein neues Secret erzeugt und hier eingetragen werden.</div>
                    <p><a href="https://learn.microsoft.com/de-de/graph/auth-v2-service" target="_blank" rel="noreferrer">Microsoft-Anleitung zur App-Authentifizierung ↗</a></p>
                </> : <>
                    <p>Die genauen Werte erhalten Sie von Ihrem Mail- oder Webhosting-Anbieter.</p>
                    <ol>
                        <li>Tragen Sie SMTP-Server und Port ein. Üblich sind Port 587 mit STARTTLS oder Port 465 mit TLS/SSL.</li>
                        <li>Verwenden Sie meistens Ihre vollständige E-Mail-Adresse als Benutzername.</li>
                        <li>Falls Ihr Anbieter Zwei-Faktor-Authentifizierung verwendet, benötigen Sie eventuell ein separates App-Passwort.</li>
                        <li>Die Absenderadresse sollte dem angemeldeten Postfach entsprechen.</li>
                        <li>Der Versandtest sendet eine echte Test-E-Mail an die Absenderadresse.</li>
                    </ol>
                    <div className="smtp-guide-clean-note">Nutzen Sie eine unverschlüsselte Verbindung nur für einen vertrauenswürdigen Mailserver im lokalen Netzwerk.</div>
                </>}
            </div>
        </BaseDialog>
    );
}

export default function SmtpSettingsDialog({ dialogRef }) {
    const guideRef = useRef(null);
    const { request } = useApi();
    const { showSuccess } = useGlobalError();
    const [configuration, setConfiguration] = useState(EMPTY_CONFIGURATION);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tested, setTested] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;
        request('/api/smtp-settings', { showErrorMessage: false })
            .then((response) => {
                if (active && response?.configuration) setConfiguration({ ...EMPTY_CONFIGURATION, ...response.configuration, password: '', clientSecret: '' });
            })
            .catch(() => undefined)
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [request]);

    const setField = (field, value) => {
        setTested(false);
        setResult(null);
        setConfiguration((current) => ({ ...current, [field]: value }));
    };

    const selectProvider = (provider) => {
        setTested(false);
        setResult(null);
        setConfiguration((current) => ({ ...current, provider }));
    };

    const isComplete = useMemo(() => {
        if (!configuration.fromAddress.trim() || !configuration.fromName.trim()) return false;
        if (configuration.provider === 'microsoft') return Boolean(configuration.tenantId.trim() && configuration.clientId.trim() && (configuration.clientSecret || configuration.clientSecretConfigured));
        return Boolean(configuration.host.trim() && Number(configuration.port) && (!configuration.username.trim() || configuration.password || configuration.passwordConfigured));
    }, [configuration]);

    const testConnection = async () => {
        setTesting(true);
        setResult(null);
        try {
            await request('/api/smtp-settings', { method: 'POST', data: configuration, showErrorMessage: false });
            setTested(true);
            setResult({ type: 'success', message: `Test-E-Mail erfolgreich an ${configuration.fromAddress} gesendet.` });
        } catch (error) {
            setTested(false);
            setResult({ type: 'error', message: error.message || 'Der Versandtest ist fehlgeschlagen.' });
        } finally {
            setTesting(false);
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            const saved = await request('/api/smtp-settings', { method: 'PUT', data: configuration, errorContext: 'Beim Speichern der E-Mail-Einstellungen' });
            setConfiguration((current) => ({ ...current, ...saved.configuration, password: '', clientSecret: '' }));
            showSuccess('E-Mail-Versand erfolgreich eingerichtet.', 'E-Mail-Einstellungen');
            dialogRef.current?.close();
        } catch {
            // useApi displays the contextual error message.
        } finally {
            setSaving(false);
        }
    };

    return <>
        <BaseDialog dialogRef={dialogRef} title="Eigenen Mailserver einrichten" size="xl" showDefaultClose={false} actions={[
            { label: 'Abbrechen', variant: 'secondary', position: 'left', cancel: true, onClick: () => dialogRef.current?.close() },
            { label: saving ? 'Speichert…' : 'Speichern', variant: 'primary', position: 'right', primary: true, disabled: !tested || saving, onClick: save },
        ]}>
            <div className="smtp-sheet">
                <p className="smtp-sheet-intro">Tragen Sie die Zugangsdaten für Ihren Mailserver ein. Microsoft 365 wird sicher über die Graph API verbunden.</p>
                <div className="smtp-provider-grid-clean">
                    {Object.entries(PROVIDERS).map(([key, provider]) => <button key={key} type="button" className={`smtp-provider-clean ${configuration.provider === key ? 'is-selected' : ''}`} onClick={() => selectProvider(key)} aria-pressed={configuration.provider === key}><strong>{provider.label}</strong><span>{provider.description}</span></button>)}
                </div>

                {loading ? <p>Einstellungen werden geladen…</p> : <div className="smtp-sheet-form">
                    <label className="smtp-clean-field"><span>Absender-Adresse</span><input className="form-control" type="email" value={configuration.fromAddress} onChange={(event) => setField('fromAddress', event.target.value)} placeholder="sv@schule.de" /></label>
                    <label className="smtp-clean-field"><span>Absender-Name</span><input className="form-control" value={configuration.fromName} onChange={(event) => setField('fromName', event.target.value)} placeholder="Schülervertretung" maxLength="100" /></label>

                    {configuration.provider === 'microsoft' ? <>
                        <label className="smtp-clean-field"><span>Client-ID</span><input className="form-control" value={configuration.clientId} onChange={(event) => setField('clientId', event.target.value.trim())} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" /></label>
                        <label className="smtp-clean-field"><span>Tenant-ID</span><input className="form-control" value={configuration.tenantId} onChange={(event) => setField('tenantId', event.target.value.trim())} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoComplete="off" /></label>
                        <label className="smtp-clean-field smtp-clean-field--wide"><span>{configuration.clientSecretConfigured ? 'Neues Client-Secret (optional)' : 'Client-Secret'}</span><div className="smtp-secret-with-help"><input className="form-control" type="password" value={configuration.clientSecret} onChange={(event) => setField('clientSecret', event.target.value)} placeholder={configuration.clientSecretConfigured ? 'Gespeichertes Secret beibehalten' : 'Secret-Wert einfügen'} autoComplete="new-password" /><button type="button" className="smtp-guide-link" onClick={() => guideRef.current?.showModal()}>Anleitung ↗</button></div></label>
                    </> : <>
                        <label className="smtp-clean-field"><span>SMTP-Server</span><input className="form-control" value={configuration.host} onChange={(event) => setField('host', event.target.value.trim())} placeholder="smtp.example.org" /></label>
                        <label className="smtp-clean-field"><span>Port und Verschlüsselung</span><div className="smtp-port-security"><input className="form-control" type="number" min="1" max="65535" value={configuration.port} onChange={(event) => setField('port', event.target.value)} /><select className="form-control" value={configuration.security} onChange={(event) => setField('security', event.target.value)}><option value="starttls">STARTTLS</option><option value="tls">TLS/SSL</option><option value="none">Keine</option></select></div></label>
                        <label className="smtp-clean-field"><span>Benutzername</span><input className="form-control" value={configuration.username} onChange={(event) => setField('username', event.target.value)} placeholder="mail@schule.de" autoComplete="username" /></label>
                        <label className="smtp-clean-field"><span>{configuration.passwordConfigured ? 'Neues Passwort (optional)' : 'Passwort'}</span><input className="form-control" type="password" value={configuration.password} onChange={(event) => setField('password', event.target.value)} placeholder={configuration.passwordConfigured ? 'Gespeichertes Passwort beibehalten' : 'Passwort eingeben'} autoComplete="new-password" /></label>
                        <button type="button" className="smtp-guide-link smtp-guide-link--standalone" onClick={() => guideRef.current?.showModal()}>SMTP-Anleitung öffnen ↗</button>
                    </>}
                </div>}

                <div className="smtp-test-panel"><div><strong>Versand testen</strong><span>{configuration.fromAddress ? `Wir senden eine Test-E-Mail an ${configuration.fromAddress}.` : 'Geben Sie zuerst die Absenderadresse und Zugangsdaten ein.'}</span></div><button className="btn btn-success" type="button" onClick={testConnection} disabled={!isComplete || testing}>{testing ? 'Wird gesendet…' : 'Test-E-Mail senden'}</button></div>
                {result && <div className={`smtp-test-result smtp-test-result--${result.type}`} role="status">{result.message}</div>}
            </div>
        </BaseDialog>
        <SetupGuideDialog dialogRef={guideRef} provider={configuration.provider} />
    </>;
}
