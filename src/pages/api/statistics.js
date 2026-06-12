import { handleMethodNotAllowed, handleError, handleSuccess } from '../../utils/apiHelpers.js';
import { getStatisticsPayload } from '../../utils/statisticsService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return handleMethodNotAllowed(res, ['GET']);
  }

  try {
    const { statistics } = await getStatisticsPayload();
    return handleSuccess(res, statistics, 'Statistiken erfolgreich berechnet');
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Berechnen der Statistiken');
  }
}
