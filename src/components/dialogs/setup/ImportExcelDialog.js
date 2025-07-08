import React from 'react';
import styles from '../../../styles/Setup.module.css';

const ImportExcelDialog = ({
    dialogRef,
    handleUploadExcel,
    handleFileChange,
    loading,
    message,
    insertedCount
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Excel-Datei hochladen</h2>
            <p>Die ersten drei Spalten der Excel-Tabelle sind Vorname, Nachname und Klasse</p>
            <p>Die erste Zeile ist für Überschriften reserviert</p>
            <form onSubmit={handleUploadExcel} className={styles.uploadForm}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".xlsx"
                    required
                    className={styles.fileInput}
                />
                <button type="submit" className={styles.button} disabled={loading.upload}>
                    Hochladen
                </button>
                <br />
                {loading.upload && <div className={styles.progress} />}
            </form>
            {message.upload && <p className={styles.message}>{message.upload}</p>}
            {insertedCount > 0 && <p className={styles.message}>Eingefügte Datensätze: {insertedCount}</p>}
        </dialog>
    );
};

export default ImportExcelDialog;
