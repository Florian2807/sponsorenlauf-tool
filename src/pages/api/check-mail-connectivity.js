import { getConfiguredSmtpTransport } from '../../utils/smtpService.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let transporter;
    try {
        ({ transporter } = await getConfiguredSmtpTransport());
        await transporter.verify();
        return res.status(200).json({ connected: true });
    } catch {
        return res.status(200).json({ connected: false });
    } finally {
        transporter?.close?.();
    }
}
