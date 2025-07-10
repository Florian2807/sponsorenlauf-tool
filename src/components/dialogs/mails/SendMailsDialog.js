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
            position: 'left',
            onClick: () => dialogRef.current.close()
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
            actionLayout="split"
            size="large"
            showDefaultClose={false}
        >
            <div className="send-mails-content">
                <h3>Microsoft Login</h3>

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
                        className="form-input"
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
                        className="form-input"
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
                        className="form-input"
                    />
                </div>

                <div className="login-section">
                    <button className="btn btn-secondary" onClick={handleLogin}>Login</button>
                    {status.loginLoading && <div className="loading-spinner" />}
                    {status.loginMessage && <p className="message">{status.loginMessage}</p>}
                </div>

                {status.uploadLoading && <div className="loading-spinner" />}
            </div>
        </BaseDialog>
    );
};

export default SendMailsDialog;
