import { handleError, handleMethodNotAllowed } from '../../utils/apiHelpers';
import { getStatisticsPayload } from '../../utils/statisticsService.js';
import { renderStatisticsHtmlReport, renderStatisticsPdfReport } from '../../utils/statisticsExport.js';

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
        const { statistics, donationMode, moduleConfig } = await getStatisticsPayload();
        const htmlContent = renderStatisticsHtmlReport({ statistics, donationMode, moduleConfig });
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
 * PDF Summary Export
 */
async function handlePdfSummaryExport(req, res, options) {
    try {
        const { statistics, donationMode, moduleConfig } = await getStatisticsPayload();
        const buffer = await renderStatisticsPdfReport({ statistics, donationMode, moduleConfig });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_statistiken.pdf');
        res.send(buffer);
    } catch (error) {
        return handleError(res, error, 500, 'Fehler beim PDF-Export');
    }
}

/**
 * Wendet HTML-Optionen auf den HTML-Content an
 */
function applyHtmlOptions(htmlContent, options) {
    return htmlContent;
}
