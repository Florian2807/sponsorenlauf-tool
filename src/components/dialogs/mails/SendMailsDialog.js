import React from 'react';
import BaseDialog from '../../BaseDialog';

const PRESETS = {
    microsoft: { host: 'smtp.office365.com', port: 587, security: 'starttls' },
    gmail: { host: 'smtp.gmail.com', port: 587, security: 'starttls' },
    custom: {},
};

const SendMailsDialog = ({
    dialogRef,
    fileData,
    setFileData,
    credentialsCorrect,
    handleLogin,
    status,
    handleUpload,
    internetConnected,
    connectivityLoading,
    checkInternetConnectivity,
}) => {
    const setField = (field, value) => setFileData((current) => ({ ...current, [field]: value }));
    const hasRequiredSettings = fileData.host
        && fileData.port
        && fileData.fromAddress
        && fileData.fromName
        && (!fileData.username || fileData.password || fileData.passwordConfigured);

    const actions = [
        { label: 'Abbrechen', onClick: () => dialogRef.current?.close(), variant: 'secondary' },
        {
            label: status.loginLoading ? 'Teste…' : credentialsCorrect ? 'Erneut testen' : 'Testen & speichern',
            onClick: handleLogin,
            variant: credentialsCorrect ? 'success' : 'primary',
            disabled: !hasRequiredSettings || status.loginLoading || internetConnected === false,
        },
        {
            label: status.uploadLoading ? 'Erzeuge Dateien…' : 'Weiter zur E-Mail-Auswahl',
            variant: 'success',
            onClick: handleUpload,
            disabled: !credentialsCorrect || status.uploadLoading || internetConnected === false,
        },
    ];

    return (
        <BaseDialog dialogRef={dialogRef} title="SMTP-Server einrichten" actions={actions} size="xl" showDefaultClose={false}>
            <div className="mail-dialog-content">
                <div className="setup-summary-box">
                    <strong>Eigener SMTP-Server</strong>
                    <p>Die Zugangsdaten werden verschlüsselt auf dem Raspberry Pi gespeichert. Serverzertifikate werden immer geprüft.</p>
                </div>

                <div className="connectivity-dialog-compact">
                    {connectivityLoading ? 'Prüfe Internetverbindung…' : internetConnected
                        ? '✅ Internetverbindung verfügbar'
                        : <span>❌ Kein Internet <button type="button" onClick={checkInternetConnectivity}>Erneut prüfen</button></span>}
                </div>

                <div className="mail-config-section">
                    <h3 className="section-subtitle">Schnellauswahl</h3>
                    <div className="provider-selection">
                        {[
                            ['microsoft', 'Microsoft 365'],
                            ['gmail', 'Gmail'],
                            ['custom', 'Eigener Server'],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setFileData((current) => ({ ...current, ...PRESETS[key] }))}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mail-config-section">
                    <h3 className="section-subtitle">Server</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="smtp-host">SMTP-Server</label>
                            <input id="smtp-host" className="form-control" value={fileData.host} onChange={(event) => setField('host', event.target.value)} placeholder="smtp.example.org" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="smtp-port">Port</label>
                            <input id="smtp-port" className="form-control" type="number" min="1" max="65535" value={fileData.port} onChange={(event) => setField('port', Number(event.target.value))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="smtp-security">Verschlüsselung</label>
                            <select id="smtp-security" className="form-control" value={fileData.security} onChange={(event) => setField('security', event.target.value)}>
                                <option value="starttls">STARTTLS (empfohlen)</option>
                                <option value="tls">TLS direkt</option>
                                <option value="none">Keine – nur für vertrauenswürdige lokale Server</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mail-config-section">
                    <h3 className="section-subtitle">Anmeldung und Absender</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="smtp-user">Benutzername</label>
                            <input id="smtp-user" className="form-control" value={fileData.username} onChange={(event) => setField('username', event.target.value)} autoComplete="username" placeholder="Meist die vollständige E-Mail-Adresse" />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="smtp-password">Passwort oder App-Passwort</label>
                            <input id="smtp-password" className="form-control" type="password" value={fileData.password} onChange={(event) => setField('password', event.target.value)} autoComplete="new-password" placeholder={fileData.passwordConfigured ? 'Gespeichertes Passwort beibehalten' : ''} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="smtp-from-address">Absenderadresse</label>
                            <input id="smtp-from-address" className="form-control" type="email" value={fileData.fromAddress} onChange={(event) => setField('fromAddress', event.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="smtp-from-name">Absendername</label>
                            <input id="smtp-from-name" className="form-control" value={fileData.fromName} onChange={(event) => setField('fromName', event.target.value)} maxLength="100" required />
                        </div>
                    </div>
                </div>

                {status.loginMessage && (
                    <div className={`status-message ${credentialsCorrect ? 'success' : 'error'}`}>
                        <div className="status-text"><strong>{status.loginMessage}</strong></div>
                    </div>
                )}
            </div>
        </BaseDialog>
    );
};

export default SendMailsDialog;
