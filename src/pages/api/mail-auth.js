import nodemailer from 'nodemailer';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import { validateEmail } from '../../utils/validation.js';

const testEmailConnection = async (email, password) => {
  const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: { user: email, pass: password }
  });

  await transporter.verify();
  return transporter;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return handleMethodNotAllowed(res, ['POST']);
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return handleValidationError(res, ['E-Mail und Passwort sind erforderlich']);
    }

    if (!validateEmail(email)) {
      return handleValidationError(res, ['Ungültige E-Mail-Adresse']);
    }

    await testEmailConnection(email, password);
    return handleSuccess(res, null, 'E-Mail-Anmeldung erfolgreich');
  } catch (error) {
    return handleError(res, error, 401, 'E-Mail-Anmeldung fehlgeschlagen');
  }
}
