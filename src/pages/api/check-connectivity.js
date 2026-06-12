import { getSystemConnectivity } from '../../utils/systemMaintenance.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const connectivity = await getSystemConnectivity();
        
        res.status(200).json({ 
            connected: connectivity.internetConnected,
            lanConnected: connectivity.lanConnected,
            canRunUpdate: connectivity.canRunUpdate,
            message: connectivity.internetConnected ? 'Internetverbindung verfügbar' : 'Keine Internetverbindung'
        });
    } catch (error) {
        res.status(200).json({ 
            connected: false,
            message: 'Fehler beim Prüfen der Internetverbindung'
        });
    }
}
