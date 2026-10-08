import { getModuleConfig } from '../../utils/settingsService.js';
import { getScanFeedHub } from '../../utils/scanFeedHub.js';
import { getRecentScans, getScanPage, isScanDeviceId, publishScanError } from '../../utils/scanFeedService.js';
import { getRequestCookie, verifyAdminSessionToken } from '../../utils/adminAuthService.js';
import { handleError, handleMethodNotAllowed } from '../../utils/apiHelpers.js';

export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
    if (!['GET', 'POST'].includes(req.method)) return handleMethodNotAllowed(res, ['GET', 'POST']);
    if (req.method === 'POST') {
        if (!isScanDeviceId(req.body?.deviceId)) return res.status(400).json({ message: 'Ungültige Geräte-ID' });
        try {
            await publishScanError(req.body.deviceId);
            res.status(204).end();
            return;
        } catch (error) { return handleError(res, error, 503, 'Scan-Hinweis konnte nicht gesendet werden'); }
    }
    const { device, stream } = req.query;
    const paginated = req.query.page !== undefined;
    const adminView = paginated || !device || req.query.view === 'admin';
    const limit = device && req.query.view === 'display' ? 1 : 30;
    if (device !== undefined && !isScanDeviceId(device)) {
        return res.status(400).json({ message: 'Ungültiger Anzeige-Link' });
    }
    const token = getRequestCookie(req);
    try {
        if (req.query.view === 'display' && !(await getModuleConfig()).roundDisplay) {
            return res.status(403).json({ message: 'Rundenanzeige ist deaktiviert' });
        }
        if (adminView && !(await verifyAdminSessionToken(token))) {
            return res.status(401).json({ message: 'Administrator-Anmeldung erforderlich' });
        }
        // no-transform prevents HTTP compression from buffering the small SSE messages.
        res.setHeader('Cache-Control', 'no-store, no-transform');
        if (paginated) {
            const { page, through, q = '', klasse, grade, expand } = req.query;
            const isInteger = value => typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
            if ((expand !== undefined && expand !== '1') || stream === '1' || !isInteger(page) || Number(page) < 1
                || (through !== undefined && !isInteger(through))
                || typeof q !== 'string' || q.length > 100
                || (grade !== undefined && (typeof grade !== 'string' || !grade.trim() || grade.length > 100))
                || (klasse !== undefined && (typeof klasse !== 'string' || klasse.length > 100))) {
                return res.status(400).json({ message: 'Ungültige Scan-Suche' });
            }
            return res.status(200).json(await getScanPage({ deviceId: device, klasse, grade, query: q,
                page: Number(page), cumulative: expand === '1', through: through === undefined ? undefined : Number(through) }));
        }
        if (stream !== '1') return res.status(200).json({ scans: await getRecentScans(device, limit) });
        if (res.destroyed) { res.end(); return; }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        res.write('retry: 2000\n\n');
        await new Promise((resolve) => {
            let stopped = false;
            let unsubscribe;
            let timer;
            let checkingAuth = false;
            const stop = () => {
                if (stopped) return;
                stopped = true;
                clearInterval(timer);
                unsubscribe?.();
                resolve();
            };
            const fail = (error) => {
                if (stopped) return;
                console.error('Scan-Stream unterbrochen:', error);
                res.end(); stop();
            };
            const write = (message) => {
                if (stopped) return;
                // A stalled client reconnects for a fresh snapshot instead of accumulating updates.
                if (res.writableLength > 256 * 1024) { res.end(); stop(); return; }
                res.write(message);
            };
            res.once('close', stop);
            if (res.destroyed) { stop(); return; }
            getScanFeedHub().subscribe(device, message => write(`data: ${message}\n\n`), fail,
                message => {
                    const data = JSON.parse(message);
                    const event = data.settingsChanged ? 'settings-change' : data.studentIds ? 'student-change' : data.device ? 'device-update' : 'scan-error';
                    write(`event: ${event}\ndata: ${message}\n\n`);
                },
                { limit, delta: true, notifyStudentChanges: adminView })
                .then(cleanup => {
                    unsubscribe = cleanup;
                    if (stopped) { cleanup(); return; }
                    timer = setInterval(async () => {
                        if (checkingAuth || stopped) return;
                        try {
                            if (adminView) {
                                checkingAuth = true;
                                if (!(await verifyAdminSessionToken(token))) { res.end(); stop(); return; }
                            }
                            write('event: heartbeat\ndata: {}\n\n');
                        } catch (error) { fail(error); }
                        finally { checkingAuth = false; }
                    }, 15000);
                }).catch(fail);
        });
    } catch (error) { return handleError(res, error, 500, 'Scans konnten nicht geladen werden'); }
}
