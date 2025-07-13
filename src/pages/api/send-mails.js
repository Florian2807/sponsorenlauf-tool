import nodemailer from 'nodemailer';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import { validateEmail } from '../../utils/validation.js';

const createTransporter = (email, password) => {
  return nodemailer.createTransporter({
    service: 'Outlook365',
    auth: { user: email, pass: password }
  });
};

const sendClassEmail = async (transporter, className, teacherData, classFileBase64, mailText, senderName, senderEmail) => {
  if (!classFileBase64 || !teacherData.length) {
    return;
  }

  const teacherEmails = teacherData.map(teacher => teacher.email);

  const mailOptions = {
    from: `${senderName} <${senderEmail}>`,
    to: teacherEmails[0],
    cc: teacherEmails.slice(1).join(', '),
    bcc: senderEmail,
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
  // Rate limiting to avoid overwhelming the email server
  await new Promise(resolve => setTimeout(resolve, 2000));
};

const validateEmailData = (teacherData, teacherFiles, email, password, senderName, mailText) => {
  const errors = [];

  if (!teacherData || !teacherFiles) {
    errors.push('Lehrerlisten oder Dateien fehlen');
  }

  if (!email || !password) {
    errors.push('E-Mail-Anmeldedaten sind erforderlich');
  }

  if (email && !validateEmail(email)) {
    errors.push('Ungültige E-Mail-Adresse');
  }

  if (!senderName?.trim()) {
    errors.push('Sendername ist erforderlich');
  }

  if (!mailText?.trim()) {
    errors.push('E-Mail-Text ist erforderlich');
  }

  return errors;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return handleMethodNotAllowed(res, ['POST']);
  }

  try {
    const {
      teacherEmails: teacherData,
      teacherFiles,
      senderName,
      mailText,
      email,
      password
    } = req.body;

    const validationErrors = validateEmailData(teacherData, teacherFiles, email, password, senderName, mailText);
    if (validationErrors.length > 0) {
      return handleValidationError(res, validationErrors);
    }

    const transporter = createTransporter(email, password);

    const sendPromises = Object.entries(teacherData).map(([className, data]) =>
      sendClassEmail(transporter, className, data, teacherFiles[className], mailText, senderName, email)
    );

    await Promise.all(sendPromises);

    return handleSuccess(res, null, 'E-Mails wurden erfolgreich versendet');
  } catch (error) {
    return handleError(res, error, 500, 'Fehler beim Senden der E-Mails');
  }
}
