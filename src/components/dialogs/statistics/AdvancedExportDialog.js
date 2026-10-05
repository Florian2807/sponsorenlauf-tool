import React, { useState, useRef, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';
import { usePanelPresentation } from '../../../contexts/PanelNavigationContext';

const AdvancedExportDialog = ({ isOpen, onClose, onExport, loading, showSpendenExport = false }) => {
    const dialogRef = useRef(null);
    const { inline: embedded } = usePanelPresentation(dialogRef);
    const [selectedFormat, setSelectedFormat] = useState(showSpendenExport ? 'excel-spenden-klassen' : 'excel-complete');
    useEffect(() => {
        if (!showSpendenExport && selectedFormat === 'excel-spenden-klassen') setSelectedFormat('excel-complete');
    }, [showSpendenExport, selectedFormat]);

    const baseExportFormats = [
        {
            id: 'excel-complete',
            title: '📊 Excel Gesamtauswertung',
            description: 'Umfassende Excel-Datei mit allen Daten und Statistiken',
            features: [
                'Alle Schülerdaten in einer Datei',
                'Erweiterte Formeln und Berechnungen',
                'Pivot-Tabellen für Analysen',
                'Diagramme und Grafiken',
                'Filterbare Datenansichten'
            ],
            recommended: true
        },
        {
            id: 'excel-classes',
            title: '📋 Excel Klassenweise',
            description: 'Separate Excel-Dateien für jede Klasse in einem ZIP-Archiv',
            features: [
                'Eine Datei pro Klasse',
                'Übersichtlich für Klassenlehrer',
                'Individuelle Klassenstatistiken',
                'Einfache Verteilung möglich',
                'ZIP-Archiv für alle Dateien'
            ]
        },
        {
            id: 'html',
            title: '🌐 HTML Dashboard Export',
            description: 'Statische HTML-Auswertung im Stil des aktuellen Statistik-Dashboards',
            features: [
                'Übersichtliche Dashboard-Struktur',
                'Geschlechterauswertung und Klassenvergleich',
                'Leicht im Browser teilbar oder druckbar',
                'Passt sich aktiven Modulen an'
            ]
        },
        {
            id: 'pdf-summary',
            title: '📄 PDF-Zusammenfassung',
            description: 'Gut lesbare PDF-Auswertung mit allen wichtigsten Kennzahlen und Rankings',
            features: [
                'Alle Kernstatistiken aufbereitet',
                'Auffälligkeiten, Geschlechterdaten und Top-Listen',
                'Ideal zum Ausdrucken oder Weitergeben',
                'Passt sich aktiven Modulen an'
            ],
            comingSoon: true
        },
    ];

    const spendenExportFormat = {
        id: 'excel-spenden-klassen',
        title: '💰 Klassenweise Spendenauswertung',
        description: 'Detaillierte Spendenauswertung pro Klasse - Format des ursprünglichen Systems',
        features: [
            'Eine Datei mit Arbeitsblatt pro Klasse',
            'Titel und Klassenname als Header',
            'Erwartete und erhaltene Spenden',
            'Differenz-Berechnung mit Farbkodierung',
            'Notizen-Spalte für Anmerkungen'
        ],
    };

    const exportFormats = showSpendenExport
        ? [spendenExportFormat, ...baseExportFormats]
        : baseExportFormats;

    useEffect(() => {
        if (embedded) {
            return undefined;
        }

        if (isOpen && dialogRef.current) {
            dialogRef.current.showModal();
        } else if (!isOpen && dialogRef.current) {
            dialogRef.current.close();
        }
    }, [embedded, isOpen]);

    const handleFormatChange = (formatId) => {
        setSelectedFormat(formatId);
    };

    const handleExport = () => {
        const exportData = {
            format: selectedFormat
        };
        onExport(exportData);
    };

    const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);

    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            disabled: loading,
            onClick: () => {
                if (embedded) {
                    onClose?.();
                    return;
                }

                dialogRef.current.close();
            }
        },
        {
            label: loading ? (
                <>
                    <div className="loading-spinner" style={{ display: 'inline-block', marginRight: '0.5rem', width: '16px', height: '16px' }}></div>
                    Exportiere...
                </>
            ) : (
                <>🚀 Export starten</>
            ),
            onClick: handleExport,
            variant: 'success',
            disabled: loading || selectedFormatData?.comingSoon
        }
    ];

    const content = (
        <div className="advanced-export-dialog">
                <div className="export-intro">
                    <p>Wählen Sie das gewünschte Export-Format für Ihre Sponsorenlauf-Auswertung.</p>
                </div>

                {/* Format-Auswahl */}
                <div className="format-selection">
                    <div className="format-grid" role="group" aria-label="Exportformat">
                        {exportFormats.map((format) => (
                            <label
                                key={format.id}
                                className={`format-card ${selectedFormat === format.id ? 'selected' : ''} ${format.comingSoon ? 'coming-soon' : ''}`}
                            >
                                <input className="sr-only" type="radio" name="export-format" aria-label={format.title} checked={selectedFormat === format.id} onChange={() => handleFormatChange(format.id)} disabled={loading || format.comingSoon} />
                                {format.recommended && (
                                    <div className="recommended-badge">⭐ Empfohlen</div>
                                )}
                                {format.comingSoon && (
                                    <div className="coming-soon-badge">🚧 Bald verfügbar</div>
                                )}
                                <div className="format-header">
                                    <h4>{format.title}</h4>
                                    <p className="format-description">{format.description}</p>
                                </div>
                                <div className="format-features">
                                    <ul>
                                        {format.features.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {selectedFormatData?.comingSoon && (
                    <div className="coming-soon-info">
                        <p>🚧 Diese Funktion wird in einem zukünftigen Update verfügbar sein.</p>
                        <p>Aktuell empfehlen wir die <strong>Excel Gesamtauswertung</strong> für die beste Erfahrung.</p>
                    </div>
                )}

                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-content">
                            <div className="loading-spinner-large"></div>
                            <h4>⚡ Export wird erstellt...</h4>
                            <p>Bitte haben Sie einen Moment Geduld.</p>
                        </div>
                    </div>
                )}
            </div>
    );

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Auswertungen exportieren"
            onClose={onClose}
            actions={actions}
            size="large"
            showDefaultClose={false}
        >
            {content}
        </BaseDialog>
    );
};

export default AdvancedExportDialog;
