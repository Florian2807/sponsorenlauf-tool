import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Versuche verschiedene Methoden zur Internetverbindungsprüfung
        let connected = false;

        try {
            // Methode 1: DNS-Lookup auf 1.1.1.1 (Cloudflare)
            await execAsync('nslookup 1.1.1.1', { timeout: 5000 });
            connected = true;
        } catch (error) {
            try {
                // Methode 2: Falls nslookup nicht funktioniert, versuche wget/curl
                await execAsync('curl -s --max-time 3 --head https://1.1.1.1 > /dev/null', { timeout: 5000 });
                connected = true;
            } catch (error2) {
                try {
                    // Methode 3: Versuche mit wget falls curl nicht verfügbar ist
                    await execAsync('wget -q --spider --timeout=3 https://1.1.1.1', { timeout: 5000 });
                    connected = true;
                } catch (error3) {
                    try {
                        // Methode 4: Letzter Versuch mit ping falls verfügbar
                        await execAsync('ping -c 1 -W 3 1.1.1.1', { timeout: 5000 });
                        connected = true;
                    } catch (error4) {
                        // Alle Methoden fehlgeschlagen
                        connected = false;
                    }
                }
            }
        }
        
        res.status(200).json({ 
            connected: connected,
            message: connected ? 'Internetverbindung verfügbar' : 'Keine Internetverbindung'
        });
    } catch (error) {
        res.status(200).json({ 
            connected: false,
            message: 'Fehler beim Prüfen der Internetverbindung'
        });
    }
}
