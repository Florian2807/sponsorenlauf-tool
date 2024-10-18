import nodemailer from 'nodemailer';
import fs from 'fs';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { teacherEmails, teacherFiles } = req.body;

        if (!teacherEmails || !teacherFiles) {
            return res.status(400).json({ message: 'Lehrerlisten oder Dateien fehlen' });
        }

        try {
            const transporter = nodemailer.createTransport({
                service: 'Outlook365',
                auth: {
                    user: process.env.OUTLOOK_MAIL,
                    pass: process.env.OUTLOOK_PASSWORD,
                },
            });

            for (const className in teacherEmails) {
                if (!teacherEmails.hasOwnProperty(className)) continue;

                const teacherEmail = teacherEmails[className];
                const classFile = teacherFiles[className];

                if (!classFile || !teacherEmail.length) {
                    console.warn(`Keine Datei oder Mailadresse für ${className} gefunden.`);
                    continue;
                }

                const mailOptions = {
                    from: `${process.env.OUTLOOK_SENDERNAME} <${process.env.OUTLOOK_MAIL}>`,
                    to: teacherEmail[0],
                    cc: teacherEmail.slice(1).join(', '),
                    bcc: process.env.OUTLOOK_MAIL,
                    subject: `Sponsorenlauf ${new Date().getFullYear()} - Schülerliste ${className}`,
                    text:
                        `Sehr geehrte Lehrkraft,\n\nanbei finden Sie die Liste der Schülerinnen und Schüler Ihrer Klasse für den Sponsorenlauf ${new Date().getFullYear()}.\n\nSchüler, die mehrmals in dieser Liste stehen, sollten die Runden bitte addiert werden, da diese eine Ersatzkarte erhalten haben.\n\nMit freundlichen Grüßen,\n\n Ihr SV-Team`,
                    attachments: [
                        {
                            filename: `${className}.xlsx`,
                            content: fs.readFileSync(classFile),
                            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        },
                    ],
                };

                // Sende die E-Mail
                await transporter.sendMail(mailOptions);
                console.log(`E-Mail an ${className} gesendet`);

                // Wartezeit zwischen den E-Mails
                await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 Sekunden warten
            }

            res.status(200).json({ message: 'E-Mails wurden erfolgreich versendet' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Fehler beim Senden der E-Mails', error });
        }
    } else {
        res.status(405).json({ message: 'Methode nicht erlaubt' });
    }
}
