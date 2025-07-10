import React from 'react';

const ExportSpendenDialog = ({
    dialogRef,
    downloadResults,
    loading
}) => {
    return (
        <dialog ref={dialogRef}>
            <button className="dialog-close" onClick={() => dialogRef.current.close()}>
                &times;
            </button>
            <h2>Spenden Auswertungen downloaden</h2>
            <div className="dialog-buttons">
                <button
                    onClick={() => downloadResults('allstudents')}
                    className="btn btn-primary"
                    disabled={loading.downloadResults}
                >
                    Gesamtauswertung
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => downloadResults('classes')}
                    disabled={loading.downloadResults}
                >
                    Klassenweise Auswertung
                </button>
            </div>
            {loading.downloadResults && <div className="progress-bar" />}
        </dialog>
    );
};

export default ExportSpendenDialog;
