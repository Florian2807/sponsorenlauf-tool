import React from 'react';
import styles from '../../../styles/Mails.module.css';

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
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
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

            <button onClick={handleLogin}>Login</button>
            <br />
            {status.loginLoading && <div className={styles.progress} />}
            {status.loginMessage && <p>{status.loginMessage}</p>}

            <div className={styles.popupButtons}>
                <button onClick={() => dialogRef.current.close()} className={`${styles.button} ${styles.redButton}`}>
                    Abbrechen
                </button>
                <button className={styles.button} onClick={handleUpload} disabled={!credentialsCorrect}>
                    Weiter
                </button>
            </div>
            {status.uploadLoading && <div className={styles.progress} />}
        </dialog>
    );
};

export default SendMailsDialog;
