import React from 'react';
import BaseDialog from '../../BaseDialog';

const ExportSpendenDialog = ({
    dialogRef,
    downloadResults,
    downloadHtmlReport,
    loading
}) => {
    const actions = [
        {
            label: 'Schließen',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'HTML Web-Report',
            variant: 'info',
            onClick: () => downloadHtmlReport(),
            disabled: loading.downloadResults
        },
        {
            label: 'Excel Gesamtauswertung',
            variant: 'success',
            onClick: () => downloadResults('allstudents'),
            disabled: loading.downloadResults
        },
        {
            label: 'Excel Klassenweise',
            variant: 'success',
            onClick: () => downloadResults('classes'),
            disabled: loading.downloadResults
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Auswertungen downloaden"
            actions={actions}
            size='large'
            showDefaultClose={false}
        >
            <div className="export-dialog-content">
                <div className="export-option">
                    <h4>🌐 HTML Web-Report (VERBESSERT)</h4>
                    <p><strong>Interaktive Auswertung mit Charts und Tabs!</strong> Web-optimierte Auswertung mit Diagrammen, Geschlechterverteilung und detaillierten Einblicken. Kann in jedem Browser geöffnet werden und ist perfekt zum Teilen und Präsentieren der Ergebnisse.</p>
                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5rem' }}>
                        ✨ Features: Interaktive Diagramme, Tab-Navigation, erweiterte Statistiken
                    </div>
                </div>

                <div className="export-option">
                    <h4>� Excel Auswertungen</h4>
                    <p>Detaillierte Daten in Excel-Format für weitere Bearbeitung und Analyse. Verfügbar als Gesamtauswertung oder klassenweise aufgeteilt - ideal für weiterführende Datenanalyse und Archivierung.</p>
                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5rem' }}>
                        💼 Professionell: Klassenübersichten, Rundenstatistiken, Spendenauswertungen
                    </div>
                </div>
            </div>

            {loading.downloadResults && (
                <div className="progress-container">
                    <div className="progress-bar" />
                    <p>Erstelle Auswertung...</p>
                </div>
            )}
        </BaseDialog>
    );
};

export default ExportSpendenDialog;
