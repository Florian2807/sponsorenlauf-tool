import React from 'react';


const SendMailsDialog = ({
    dialogRef,
    fileData,
    setFileData,
    credentialsCorrect,
    handleLogin,
    status,
    handleUpload
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Mails mit Tabellen versenden</h2>

            <h2>Microsoft Login</h2>
            <label>E-Mail Adresse:</label>
            <input
                type="email"
                name="email"
                placeholder="E-Mail Adresse"
                value={fileData.email}
                onChange={(e) => setFileData((prev) => ({ ...prev, email: e.target.value }))}
                disabled={credentialsCorrect}
                required
            />
            <label>Passwort:</label>
            <input
                type="password"
                name="password"
                placeholder="Microsoft Passwort"
                value={fileData.password}
                onChange={(e) => setFileData((prev) => ({ ...prev, password: e.target.value }))}
                disabled={credentialsCorrect}
                required
            />
            <label>Sender-Name:</label>
            <input
                type="text"
                name="senderName"
                placeholder="Mail Absender-Name"
                value={fileData.senderName}
                onChange={(e) => setFileData((prev) => ({ ...prev, senderName: e.target.value }))}
                required
            />

            <button className="btn" onClick={handleLogin}>Login</button>
            <br />
            {status.loginLoading && <div className="loading-spinner" />}
            {status.loginMessage && <p className="message">{status.loginMessage}</p>}

            <div className="dialog-actions">
                <button onClick={() => dialogRef.current.close()} className="btn btn-secondary">
                    Abbrechen
                </button>
                <button className="btn btn-primary" onClick={handleUpload} disabled={!credentialsCorrect}>
                    Weiter
                </button>
            </div>
            {status.uploadLoading && <div className="loading-spinner" />}
        </dialog>
    );
};

export default SendMailsDialog;
