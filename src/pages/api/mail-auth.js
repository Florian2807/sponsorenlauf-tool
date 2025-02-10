import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'E-Mail oder Passwort fehlt' });
        }

        try {
            const transporter = nodemailer.createTransport({
                service: 'Outlook365',
                auth: {
                    user: email,
                    pass: password,
                },
            });

            await transporter.verify();
            return res.status(200).json({ success: true, message: 'Login erfolgreich' });
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Login fehlgeschlagen', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, message: 'Methode nicht erlaubt' });
    }
}