import { handleMethodNotAllowed, handleError } from '../../utils/apiHelpers.js';
import { getStatisticsPayload } from '../../utils/statisticsService.js';
import { renderStatisticsHtmlReport } from '../../utils/statisticsExport.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const { statistics, donationMode, moduleConfig } = await getStatisticsPayload();
    const html = renderStatisticsHtmlReport({ statistics, donationMode, moduleConfig });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=sponsorenlauf_statistiken.html');
    res.send(html);
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Erstellen des HTML-Exports');
  }
}
