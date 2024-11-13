import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { teacherEmails, teacherFiles, senderName, mailText, email, password } = req.body;

        if (!teacherEmails || !teacherFiles || !email || !password) {
            return res.status(400).json({ message: 'Lehrerlisten, Dateien oder Anmeldedaten fehlen' });
        }

        try {
            const transporter = nodemailer.createTransport({
                service: 'Outlook365',
                auth: {
                    user: email,
                    pass: password,
                },
            });

            for (const className in teacherEmails) {
                const teacherEmail = teacherEmails[className];
                const classFileBase64 = teacherFiles[className];

                if (!classFileBase64 || !teacherEmail.length) {
                    console.warn(`Keine Datei oder Mailadresse für ${className} gefunden.`);
                    continue;
                }

                const mailOptions = {
                    from: `${senderName} <${email}>`,
                    to: teacherEmail[0],
                    cc: teacherEmail.slice(1).join(', '),
                    bcc: email,
                    subject: `Sponsorenlauf ${new Date().getFullYear()} - Schülerliste Klasse ${className}`,
                    text: mailText,
                    attachments: [
                        {
                            filename: `${className}.xlsx`,
                            content: Buffer.from(classFileBase64, 'base64'),
                            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        },
                    ],
                };

                await transporter.sendMail(mailOptions);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            res.status(200).json({ message: 'E-Mails wurden erfolgreich versendet' });
        } catch (error) {
            res.status(500).json({ message: 'Fehler beim Senden der E-Mails', error });
        }
    } else if (req.method === 'POST' && req.url.endsWith('/auth')) {
        const { email, password } = req.body;
        try {
            const transporter = nodemailer.createTransport({
                service: 'Outlook365',
                auth: { user: email, pass: password }
            });
            await transporter.verify();
            res.status(200).json({ success: true, message: 'Login erfolgreich' });
        } catch (error) {
            res.status(401).json({ success: false, message: 'Login fehlgeschlagen' });
        }
    } else {
        res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
}
