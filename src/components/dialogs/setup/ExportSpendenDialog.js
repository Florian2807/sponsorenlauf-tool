import React from 'react';
import styles from '../../../styles/Setup.module.css';

const ExportSpendenDialog = ({
    dialogRef,
    downloadResults,
    loading
}) => {
    return (
        <dialog ref={dialogRef} className={styles.popup}>
            <button className={styles.closeButtonX} onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Spenden Auswertungen downloaden</h2>
            <div className={styles.popupButtons}>
                <button
                    onClick={() => downloadResults('allstudents')}
                    className={styles.button}
                    disabled={loading.downloadResults}
                >
                    Gesamtauswertung
                </button>
                <button
                    className={styles.button}
                    onClick={() => downloadResults('classes')}
                    disabled={loading.downloadResults}
                >
                    Klassenweise Auswertung
                </button>
            </div>
            {loading.downloadResults && <div className={styles.progress} />}
        </dialog>
    );
};

export default ExportSpendenDialog;
