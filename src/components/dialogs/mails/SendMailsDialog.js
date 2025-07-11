import React from 'react';
import BaseDialog from '../../BaseDialog';

const SendMailsDialog = ({
    dialogRef,
    fileData,
    setFileData,
    credentialsCorrect,
    handleLogin,
    status,
    handleUpload
}) => {
    const actions = [
        {
            label: 'Abbrechen',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Login',
            onClick: () => handleLogin(),
            variant: 'success',
            disabled: !fileData.email || !fileData.password,
        },
        {
            label: 'Weiter',
            variant: 'success',
            onClick: handleUpload,
            disabled: !credentialsCorrect
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Mails mit Tabellen versenden"
            actions={actions}
            size="large"
            showDefaultClose={false}
        >
            <div className="form">
                <h3 className="section-title">Microsoft Login</h3>

                <div className="form-group">
                    <label className="form-label">E-Mail Adresse:</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="E-Mail Adresse"
                        value={fileData.email}
                        onChange={(e) => setFileData((prev) => ({ ...prev, email: e.target.value }))}
                        disabled={credentialsCorrect}
                        required
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Passwort:</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Microsoft Passwort"
                        value={fileData.password}
                        onChange={(e) => setFileData((prev) => ({ ...prev, password: e.target.value }))}
                        disabled={credentialsCorrect}
                        required
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Sender-Name:</label>
                    <input
                        type="text"
                        name="senderName"
                        placeholder="Mail Absender-Name"
                        value={fileData.senderName}
                        onChange={(e) => setFileData((prev) => ({ ...prev, senderName: e.target.value }))}
                        required
                        className="form-control"
                    />
                </div>

                {status.loginLoading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Login wird verarbeitet...</p>
                    </div>
                )}
                {status.loginMessage && <div className="message-info">{status.loginMessage}</div>}

                {status.uploadLoading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Daten werden verarbeitet...</p>
                    </div>
                )}
            </div>
        </BaseDialog>
    );
};

export default SendMailsDialog;
