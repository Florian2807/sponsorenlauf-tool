import { getUpdateAvailability } from '../../utils/updateAvailability.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const { available, latestVersion } = await getUpdateAvailability();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ available, latestVersion });
}
