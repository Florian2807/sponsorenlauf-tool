import nodemailer from 'nodemailer';
import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import { validateEmail } from '../../utils/validation.js';

const emailProviders = {
  outlook: {
    service: 'Outlook365',
    port: 587,
    secure: false
  },
  gmail: {
    service: 'gmail',  
    port: 587,
    secure: false
  },
  yahoo: {
    service: 'yahoo',
    port: 587,
    secure: false
  },
  custom: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true'
  }
};

const testEmailConnection = async (email, password, provider = 'outlook') => {
  const config = emailProviders[provider] || emailProviders.outlook;
  
  const transporterConfig = {
    ...config,
    auth: { user: email, pass: password },
    tls: {
      rejectUnauthorized: false // Für Entwicklungsumgebungen
    }
  };

  // Für benutzerdefinierte Server
  if (provider === 'custom' && !config.service) {
    transporterConfig.host = config.host;
    transporterConfig.port = config.port;
    transporterConfig.secure = config.secure;
    delete transporterConfig.service;
  }

  const transporter = nodemailer.createTransport(transporterConfig);
  
  try {
    await transporter.verify();
    return transporter;
  } catch (error) {
    console.error(`E-Mail-Verbindung für ${email} (${provider}) fehlgeschlagen:`, error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return handleMethodNotAllowed(res, ['POST']);
  }

  try {
    const { email, password, emailProvider = 'outlook' } = req.body;

    // Basis-Validierung
    if (!email || !password) {
      return handleValidationError(res, ['E-Mail und Passwort sind erforderlich']);
    }

    if (!validateEmail(email)) {
      return handleValidationError(res, ['Ungültige E-Mail-Adresse']);
    }

    // Überprüfe ob der E-Mail-Provider gültig ist
    const validProviders = ['outlook', 'gmail', 'yahoo', 'custom'];
    if (!validProviders.includes(emailProvider)) {
      return handleValidationError(res, ['Ungültiger E-Mail-Anbieter']);
    }

    // Teste die Verbindung
    await testEmailConnection(email, password, emailProvider);
    
    return handleSuccess(res, { 
      success: true,
      provider: emailProvider,
      timestamp: new Date().toISOString()
    }, 'E-Mail-Verbindung erfolgreich getestet');
    
  } catch (error) {
    console.error('E-Mail-Authentifizierung fehlgeschlagen:', error);
    
    // Spezifische Fehlermeldungen basierend auf dem Fehler
    let errorMessage = 'E-Mail-Anmeldung fehlgeschlagen';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Benutzername oder Passwort ist falsch';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Verbindung zum E-Mail-Server fehlgeschlagen';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Zeitüberschreitung beim Verbinden zum E-Mail-Server';
    } else if (error.message.includes('Invalid login')) {
      errorMessage = 'Ungültige Anmeldedaten. Verwenden Sie ein App-Passwort für mehr Sicherheit.';
    }

    return handleError(res, error, 401, errorMessage);
  }
}
