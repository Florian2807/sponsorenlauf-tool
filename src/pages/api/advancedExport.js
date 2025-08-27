import { handleError, handleMethodNotAllowed } from '../../utils/apiHelpers';
import { dbAll } from '../../utils/database';

/**
 * API-Handler für erweiterte Export-Funktionalität
 * Unterstützt verschiedene Export-Formate mit konfigurierbaren Optionen
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return handleMethodNotAllowed(res, ['POST']);
    }

    try {
        const { format, options } = req.body;

        if (!format) {
            return handleError(res, new Error('Export-Format nicht angegeben'), 400, 'Export-Format ist erforderlich');
        }

        switch (format) {
            case 'html':
                return await handleHtmlExport(req, res, options);
            case 'excel-complete':
                return await handleExcelCompleteExport(req, res, options);
            case 'excel-classes':
                return await handleExcelClassesExport(req, res, options);
            case 'pdf-summary':
                return await handlePdfSummaryExport(req, res, options);
            default:
                return handleError(res, new Error(`Unbekanntes Export-Format: ${format}`), 400, 'Ungültiges Export-Format');
        }
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Export');
    }
}

/**
 * HTML Export mit konfigurierbaren Optionen
 */
async function handleHtmlExport(req, res, options) {
    try {
        // HTML-Export an die bestehende HTML-Export API weiterleiten
        // aber mit erweiterten Optionen
        const response = await fetch(`${req.headers.origin}/api/exportStatisticsHtml`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Fehler beim Erstellen des HTML-Reports');
        }

        const htmlContent = await response.text();

        // Optionen in den HTML-Content einbauen falls nötig
        const modifiedHtml = applyHtmlOptions(htmlContent, options);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_statistiken_erweitert.html');
        res.send(modifiedHtml);
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim HTML-Export');
    }
}

/**
 * Excel Complete Export mit Optionen
 */
async function handleExcelCompleteExport(req, res, options) {
    try {
        // Redirect zum bestehenden Excel-Export
        const response = await fetch(`${req.headers.origin}/api/exportExcel?type=complete`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Fehler beim Erstellen der Excel-Datei');
        }

        const buffer = await response.arrayBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_gesamtauswertung_erweitert.xlsx');
        res.send(Buffer.from(buffer));
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Excel-Export');
    }
}

/**
 * Excel Classes Export mit Optionen
 */
async function handleExcelClassesExport(req, res, options) {
    try {
        // Redirect zum bestehenden Excel-Export
        const response = await fetch(`${req.headers.origin}/api/exportExcel?type=class-wise`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Fehler beim Erstellen der Excel-Dateien');
        }

        const buffer = await response.arrayBuffer();

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_klassenweise_erweitert.zip');
        res.send(Buffer.from(buffer));
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim Excel-Export (klassenweise)');
    }
}

/**
 * PDF Summary Export (Coming Soon)
 */
async function handlePdfSummaryExport(req, res, options) {
    return handleError(res, new Error('PDF-Export ist noch nicht verfügbar'), 501, 'PDF-Export wird in einem zukünftigen Update implementiert');
}

/**
 * Wendet HTML-Optionen auf den HTML-Content an
 */
function applyHtmlOptions(htmlContent, options) {
    let modifiedHtml = htmlContent;

    // Falls bestimmte Optionen deaktiviert sind, entsprechende Abschnitte entfernen
    if (options) {
        if (!options.includeCharts) {
            // Charts-Tab entfernen
            modifiedHtml = modifiedHtml.replace(/<div id="charts" class="tab-content">.*?<\/div>/s, '');
            modifiedHtml = modifiedHtml.replace(/<button class="nav-tab".*?Charts.*?<\/button>/s, '');
        }

        if (!options.includeDetailedStats) {
            // Detaillierte Statistiken reduzieren
            modifiedHtml = modifiedHtml.replace(/<!-- Statistische Kennzahlen -->.*?<\/div>/s, '');
        }

        if (!options.includeGenderAnalysis) {
            // Geschlechter-Analysen entfernen
            modifiedHtml = modifiedHtml.replace(/<!-- Erweiterte Geschlechterverteilung -->.*?<\/div>/s, '');
        }

        if (!options.includePerformanceCategories) {
            // Leistungskategorien entfernen
            modifiedHtml = modifiedHtml.replace(/<!-- Leistungsanalyse nach Kategorien -->.*?<\/div>/s, '');
        }

        if (!options.includeDistanceComparisons) {
            // Distanz-Vergleiche entfernen
            modifiedHtml = modifiedHtml.replace(/<!-- Erweiterte Distanz-Vergleiche -->.*?<\/div>/s, '');
        }
    }

    return modifiedHtml;
}
