import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;

        // Überprüfung auf Vorhandensein der Anmeldedaten
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'E-Mail oder Passwort fehlt' });
        }

        try {
            // Erstelle einen nodemailer Transporter mit den übermittelten Anmeldedaten
            const transporter = nodemailer.createTransport({
                service: 'Outlook365',
                auth: {
                    user: email,
                    pass: password,
                },
            });

            // Überprüfe die Anmeldedaten, indem `transporter.verify()` aufgerufen wird
            await transporter.verify();

            // Erfolgreiche Verifizierung
            return res.status(200).json({ success: true, message: 'Login erfolgreich' });
        } catch (error) {
            // Bei Fehlern, wie falschen Anmeldedaten, wird ein 401-Status gesendet
            return res.status(401).json({ success: false, message: 'Login fehlgeschlagen', error: error.message });
        }
    } else {
        // Für andere HTTP-Methoden als POST, wird eine Fehlermeldung zurückgegeben
        res.status(405).json({ success: false, message: 'Methode nicht erlaubt' });
    }
}
