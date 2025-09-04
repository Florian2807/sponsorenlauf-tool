import React, { useState } from 'react';
import BaseDialog from '../../BaseDialog';

const SendMailsDialog = ({
    dialogRef,
    fileData,
    setFileData,
    credentialsCorrect,
    handleLogin,
    status,
    handleUpload,
    onTestEmail,
    internetConnected,
    connectivityLoading,
    checkInternetConnectivity
}) => {
    const [emailProvider, setEmailProvider] = useState('outlook');

    const emailProviders = {
        outlook: {
            name: 'Outlook/Hotmail',
            service: 'Outlook365',
            placeholder: 'beispiel@outlook.com'
        },
        gmail: {
            name: 'Gmail',
            service: 'gmail',
            placeholder: 'beispiel@gmail.com'
        },
        yahoo: {
            name: 'Yahoo',
            service: 'yahoo',
            placeholder: 'beispiel@yahoo.com'
        },
        custom: {
            name: 'Benutzerdefiniert',
            service: 'custom',
            placeholder: 'beispiel@domain.com'
        }
    };

    const actions = [
        {
            label: 'Abbrechen',
            onClick: () => dialogRef.current.close(),
            variant: 'secondary'
        },
        {
            label: status.loginLoading ? 'Verbinde...' : (credentialsCorrect ? 'Verbunden ✓' : 'Verbindung testen'),
            onClick: () => handleLogin(),
            variant: credentialsCorrect ? 'success' : 'primary',
            disabled: !fileData.email || !fileData.password || status.loginLoading || internetConnected === false,
        },
        {
            label: status.uploadLoading ? 'Lade...' : 'Weiter zu E-Mail Konfiguration',
            variant: 'success',
            onClick: handleUpload,
            disabled: !credentialsCorrect || status.uploadLoading || internetConnected === false
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="E-Mail Konfiguration & Authentifizierung"
            actions={actions}
            size="xl"
            showDefaultClose={false}
        >
            <div className="mail-dialog-content">
                {/* Progress Steps Indicator */}
                <div className="setup-progress">
                    <div className="progress-steps">
                        <div className={`progress-step ${internetConnected ? 'completed' : 'active'}`}>
                            <span className="step-number">1</span>
                            <span className="step-label">Internet</span>
                        </div>
                        <div className={`progress-step ${credentialsCorrect ? 'completed' : (internetConnected ? 'active' : 'disabled')}`}>
                            <span className="step-number">2</span>
                            <span className="step-label">E-Mail Login</span>
                        </div>
                        <div className={`progress-step ${credentialsCorrect ? 'active' : 'disabled'}`}>
                            <span className="step-number">3</span>
                            <span className="step-label">Dateien laden</span>
                        </div>
                    </div>
                </div>

                {/* Kompakte Internet-Konnektivitätsstatus */}
                <div className="connectivity-dialog-compact">
                    {connectivityLoading ? (
                        <div className="connectivity-badge-dialog loading">
                            <span className="spinner-mini"></span>
                            Prüfe Internetverbindung...
                        </div>
                    ) : internetConnected === true ? (
                        <div className="connectivity-badge-dialog connected">
                            ✅ Internetverbindung verfügbar
                        </div>
                    ) : internetConnected === false ? (
                        <div className="connectivity-badge-dialog disconnected">
                            ❌ Keine Internetverbindung - E-Mail-Versand nicht möglich
                            <button 
                                className="connectivity-retry-btn"
                                onClick={checkInternetConnectivity}
                                disabled={connectivityLoading}
                                title="Erneut prüfen"
                            >
                                🔄
                            </button>
                        </div>
                    ) : null}
                </div>

                <div className="mail-config-section">
                    <h3 className="section-subtitle">
                        <span className="subtitle-icon">📧</span>
                        E-Mail Anbieter
                    </h3>

                    <div className="provider-selection">
                        {Object.entries(emailProviders).map(([key, provider]) => (
                            <div key={key} className="provider-option">
                                <input
                                    type="radio"
                                    id={`provider-${key}`}
                                    name="emailProvider"
                                    value={key}
                                    checked={emailProvider === key}
                                    onChange={(e) => {
                                        setEmailProvider(e.target.value);
                                        setFileData((prev) => ({ ...prev, emailProvider: e.target.value }));
                                    }}
                                    className="provider-radio"
                                />
                                <label htmlFor={`provider-${key}`} className="provider-label">
                                    <span className="provider-icon">
                                        {key === 'outlook' && '🔷'}
                                        {key === 'gmail' && '📮'}
                                        {key === 'yahoo' && '💌'}
                                        {key === 'custom' && '⚙️'}
                                    </span>
                                    {provider.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mail-config-section">
                    <h3 className="section-subtitle">
                        <span className="subtitle-icon">🔐</span>
                        Anmeldedaten
                    </h3>

                    <div className="form-group">
                        <label className="form-label">E-Mail Adresse</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                name="email"
                                placeholder={emailProviders[emailProvider].placeholder}
                                value={fileData.email}
                                onChange={(e) => setFileData((prev) => ({ ...prev, email: e.target.value }))}
                                disabled={credentialsCorrect}
                                required
                                className={`form-control ${credentialsCorrect ? 'success' : ''}`}
                                autoComplete="email"
                            />
                            {credentialsCorrect && (
                                <span className="success-indicator">✓</span>
                            )}
                        </div>
                        {!credentialsCorrect && fileData.email && (
                            <div className="form-hint">
                                <span className="hint-icon">💡</span>
                                Verwenden Sie Ihre vollständige E-Mail-Adresse
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Passwort</label>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                name="password"
                                placeholder="Ihr E-Mail Passwort oder App-Passwort"
                                value={fileData.password}
                                onChange={(e) => setFileData((prev) => ({ ...prev, password: e.target.value }))}
                                disabled={credentialsCorrect}
                                required
                                className={`form-control ${credentialsCorrect ? 'success' : ''}`}
                                autoComplete="current-password"
                            />
                            {credentialsCorrect && (
                                <span className="success-indicator">✓</span>
                            )}
                        </div>
                        <div className="form-hint">
                            <span className="hint-icon">�</span>
                            {emailProvider === 'gmail' && 'Verwenden Sie ein App-Passwort für Gmail (nicht Ihr normales Passwort)'}
                            {emailProvider === 'outlook' && 'Verwenden Sie Ihr normales Outlook-Passwort oder ein App-Passwort'}
                            {emailProvider === 'yahoo' && 'Verwenden Sie ein App-Passwort für Yahoo Mail'}
                            {emailProvider === 'custom' && 'Verwenden Sie die von Ihrem Administrator bereitgestellten Anmeldedaten'}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Absender-Name</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                name="senderName"
                                placeholder="z.B. Schülervertretung Max-Mustermann-Schule"
                                value={fileData.senderName}
                                onChange={(e) => setFileData((prev) => ({ ...prev, senderName: e.target.value }))}
                                required
                                className="form-control"
                                maxLength="100"
                            />
                        </div>
                        <div className="form-hint">
                            <span className="hint-icon">ℹ️</span>
                            Dieser Name wird als Absender in den E-Mails angezeigt
                        </div>
                    </div>
                </div>

                {/* Status und Fortschritt */}
                <div className="status-section">
                    {status.loginLoading && (
                        <div className="status-message loading">
                            <div className="status-icon">
                                <div className="loading-spinner"></div>
                            </div>
                            <div className="status-text">
                                <strong>Verbindung wird getestet...</strong>
                                <p>Überprüfe E-Mail-Anmeldedaten bei {emailProviders[emailProvider].name}</p>
                            </div>
                        </div>
                    )}

                    {credentialsCorrect && !status.loginLoading && (
                        <div className="status-message success">
                            <div className="status-icon">
                                <span className="status-emoji">✅</span>
                            </div>
                            <div className="status-text">
                                <strong>Verbindung erfolgreich!</strong>
                                <p>Ihre E-Mail-Konfiguration wurde erfolgreich überprüft. Sie können nun mit dem nächsten Schritt fortfahren.</p>
                            </div>
                        </div>
                    )}

                    {status.loginMessage && !credentialsCorrect && !status.loginLoading && (
                        <div className="status-message error">
                            <div className="status-icon">
                                <span className="status-emoji">❌</span>
                            </div>
                            <div className="status-text">
                                <strong>Verbindungsfehler</strong>
                                <p>{status.loginMessage}</p>
                                <div className="error-suggestions">
                                    <strong>Mögliche Lösungen:</strong>
                                    <ul>
                                        <li>Überprüfen Sie Ihre E-Mail-Adresse und Passwort</li>
                                        {emailProvider === 'gmail' && <li>Verwenden Sie ein App-Passwort anstelle Ihres normalen Passworts</li>}
                                        {emailProvider === 'outlook' && <li>Stellen Sie sicher, dass 2-Faktor-Authentifizierung konfiguriert ist</li>}
                                        <li>Prüfen Sie Ihre Internetverbindung</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {status.uploadLoading && (
                        <div className="status-message loading">
                            <div className="status-icon">
                                <div className="loading-spinner"></div>
                            </div>
                            <div className="status-text">
                                <strong>Daten werden verarbeitet...</strong>
                                <p>Excel-Dateien werden geladen und für den E-Mail-Versand vorbereitet</p>
                            </div>
                        </div>
                    )}
                </div>

                {emailProvider === 'custom' && (
                    <div className="mail-config-section">
                        <h3 className="section-subtitle">
                            <span className="subtitle-icon">⚙️</span>
                            Server-Einstellungen
                        </h3>
                        <div className="custom-server-hint">
                            <span className="hint-icon">⚠️</span>
                            Für benutzerdefinierte E-Mail-Anbieter wenden Sie sich an den Administrator
                        </div>
                    </div>
                )}
            </div>
        </BaseDialog>
    );
};

export default SendMailsDialog;
