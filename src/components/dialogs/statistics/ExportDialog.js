import React, { useRef, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';

const ExportDialog = ({ isOpen, onClose, onExport, loading }) => {
    const dialogRef = useRef(null);

    const exportOptions = [
        {
            type: 'class-wise',
            title: 'Klassenweise Auswertung',
            description: 'Separate Excel-Dateien für jede Klasse in einem ZIP-Archiv',
            icon: '📊'
        },
        {
            type: 'complete',
            title: 'Gesamtauswertung',
            description: 'Eine einzige Excel-Datei mit allen Daten und Statistiken',
            icon: '📈'
        }
    ];

    useEffect(() => {
        if (isOpen && dialogRef.current) {
            dialogRef.current.showModal();
        } else if (!isOpen && dialogRef.current) {
            dialogRef.current.close();
        }
    }, [isOpen]);

    const handleExport = (exportType) => {
        onExport(exportType);
    };

    const actions = [
        {
            label: 'Abbrechen',
            onClick: onClose,
            variant: 'secondary',
            disabled: loading
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Excel Export auswählen"
            onClose={onClose}
            actions={actions}
            size="large"
            showDefaultClose={false}
        >
            <div className="form">
                <p className="form-description">
                    Wählen Sie die gewünschte Export-Option für Ihre Statistiken:
                </p>

                <div className="method-selector">
                    {exportOptions.map((option) => (
                        <div key={option.type} className="method-option">
                            <input
                                type="radio"
                                id={option.type}
                                name="exportType"
                                value={option.type}
                                className="method-radio"
                                disabled={loading}
                            />
                            <div className="method-icon">{option.icon}</div>
                            <div className="method-content">
                                <strong>{option.title}</strong>
                                <p>{option.description}</p>
                                <button
                                    className="btn btn-primary btn-block"
                                    onClick={() => handleExport(option.type)}
                                    disabled={loading}
                                    style={{ marginTop: '1rem' }}
                                >
                                    {loading ? (
                                        <>
                                            <div className="loading-spinner" style={{ display: 'inline-block', marginRight: '0.5rem', width: '16px', height: '16px' }}></div>
                                            Exportiere...
                                        </>
                                    ) : (
                                        <>
                                            📥 Exportieren
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Export wird vorbereitet...</p>
                    </div>
                )}
            </div>
        </BaseDialog>
    );
};

export default ExportDialog;
