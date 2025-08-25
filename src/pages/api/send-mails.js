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

const createTransporter = (email, password, provider = 'outlook') => {
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

  return nodemailer.createTransport(transporterConfig);
};

const sendClassEmail = async (transporter, className, teacherData, classFileBase64, mailText, senderName, senderEmail) => {
  if (!classFileBase64 || !teacherData.length) {
    console.warn(`Überspringe Klasse ${className}: Keine Datei oder Lehrer`);
    return false;
  }

  const teacherEmails = teacherData.map(teacher => teacher.email).filter(Boolean);
  
  if (teacherEmails.length === 0) {
    console.warn(`Überspringe Klasse ${className}: Keine gültigen E-Mail-Adressen`);
    return false;
  }

  const currentYear = new Date().getFullYear();
  const mailOptions = {
    from: `${senderName} <${senderEmail}>`,
    to: teacherEmails[0],
    cc: teacherEmails.slice(1).join(', '),
    bcc: senderEmail, // Kopie an Absender
    subject: `Sponsorenlauf ${currentYear} - Ergebnisliste Klasse ${className}`,
    text: mailText,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4a90e2, #357abd); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🏃‍♂️ Sponsorenlauf ${currentYear}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ergebnisliste Klasse ${className}</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="white-space: pre-wrap; margin-bottom: 20px;">${mailText}</div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4a90e2;">
              <p style="margin: 0; font-weight: bold; color: #4a90e2;">📎 Anhang:</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Excel-Datei mit den Laufergebnissen der Schüler</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #888;">
                Diese E-Mail wurde automatisch generiert • ${new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Sponsorenlauf_${currentYear}_Klasse_${className}.xlsx`,
        content: Buffer.from(classFileBase64, 'base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    
    // Rate limiting um den E-Mail-Server nicht zu überlasten
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error(`Fehler beim Senden der E-Mail für Klasse ${className}:`, error);
    throw error;
  }
};

const validateEmailData = (teacherData, teacherFiles, email, password, senderName, mailText, emailProvider) => {
  const errors = [];

  // Basis-Validierung
  if (!teacherData || typeof teacherData !== 'object') {
    errors.push('Lehrerdaten fehlen oder sind ungültig');
  }

  // Prüfe ob mindestens eine Klasse Lehrer hat
  const hasAnyTeachers = teacherData && Object.values(teacherData).some(teachers => 
    Array.isArray(teachers) && teachers.length > 0 && teachers.some(teacher => teacher.email)
  );

  if (!hasAnyTeachers) {
    errors.push('Keine Klasse hat gültige Lehrer-E-Mail-Adressen zugewiesen');
  }

  if (!teacherFiles || typeof teacherFiles !== 'object') {
    errors.push('Klassendateien fehlen oder sind ungültig');
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

  if (senderName && senderName.length > 100) {
    errors.push('Sendername ist zu lang (maximal 100 Zeichen)');
  }

  if (!mailText?.trim()) {
    errors.push('E-Mail-Text ist erforderlich');
  }

  if (mailText && mailText.length > 10000) {
    errors.push('E-Mail-Text ist zu lang (maximal 10.000 Zeichen)');
  }

  // E-Mail-Provider Validierung
  const validProviders = ['outlook', 'gmail', 'yahoo', 'custom'];
  if (emailProvider && !validProviders.includes(emailProvider)) {
    errors.push('Ungültiger E-Mail-Anbieter');
  }

  // Detaillierte Lehrer-Validierung (nicht blockierend für leere Klassen)
  if (teacherData) {
    Object.entries(teacherData).forEach(([className, teachers]) => {
      if (!Array.isArray(teachers) || teachers.length === 0) {
        // Nur warnen, nicht blockieren
        console.warn(`Klasse ${className}: Keine Lehrer zugewiesen - wird übersprungen`);
        return;
      }

      teachers.forEach((teacher, index) => {
        if (!teacher.email || !validateEmail(teacher.email)) {
          errors.push(`Klasse ${className}, Lehrer ${index + 1}: Ungültige E-Mail-Adresse`);
        }
      });
    });
  }

  // File-Validation (nicht blockierend für Klassen ohne Lehrer)
  if (teacherFiles && teacherData) {
    Object.keys(teacherData).forEach(className => {
      // Nur prüfen wenn Klasse Lehrer hat
      if (teacherData[className] && Array.isArray(teacherData[className]) && teacherData[className].length > 0) {
        if (!teacherFiles[className]) {
          errors.push(`Klasse ${className}: Zugehörige Datei fehlt`);
        }
      }
    });
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
      password,
      emailProvider = 'outlook'
    } = req.body;

    // Validierung der Eingabedaten
    const validationErrors = validateEmailData(
      teacherData, 
      teacherFiles, 
      email, 
      password, 
      senderName, 
      mailText, 
      emailProvider
    );
    
    if (validationErrors.length > 0) {
      console.warn('Validierungsfehler:', validationErrors);
      return handleValidationError(res, validationErrors);
    }

    // Transporter erstellen und testen
    const transporter = createTransporter(email, password, emailProvider);
    
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('E-Mail-Server-Verbindung fehlgeschlagen:', verifyError);
      return handleError(res, verifyError, 401, 'E-Mail-Server-Verbindung fehlgeschlagen. Überprüfen Sie Ihre Anmeldedaten.');
    }

    // E-Mails versenden - nur für Klassen mit Lehrern
    const allClassNames = Object.keys(teacherData);
    const classNamesWithTeachers = allClassNames.filter(className => {
      const teachers = teacherData[className];
      return Array.isArray(teachers) && teachers.length > 0 && teachers.some(teacher => teacher.email);
    });

    const results = {
      total: allClassNames.length,
      processed: classNamesWithTeachers.length,
      skipped: allClassNames.length - classNamesWithTeachers.length,
      successful: 0,
      failed: 0,
      errors: [],
      skippedClasses: allClassNames.filter(className => !classNamesWithTeachers.includes(className))
    };

    // Log übersprungene Klassen
    if (results.skipped > 0) {
      console.log(`Überspringe ${results.skipped} Klassen ohne Lehrer-Zuordnungen:`, results.skippedClasses);
    }

    for (const className of classNamesWithTeachers) {
      try {
        const success = await sendClassEmail(
          transporter, 
          className, 
          teacherData[className], 
          teacherFiles[className], 
          mailText, 
          senderName, 
          email
        );
        
        if (success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(`Klasse ${className}: Keine gültigen Daten zum Senden`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Klasse ${className}: ${error.message}`);
        console.error(`Fehler beim Senden für Klasse ${className}:`, error);
      }
    }

    // Ergebnis zurückgeben
    let message;
    if (results.failed === 0 && results.skipped === 0) {
      message = `Alle ${results.successful} E-Mails wurden erfolgreich versendet!`;
    } else if (results.failed === 0) {
      message = `${results.successful} E-Mails erfolgreich versendet. ${results.skipped} Klassen übersprungen (keine Lehrer zugeordnet).`;
    } else {
      message = `${results.successful} von ${results.processed} E-Mails erfolgreich versendet. ${results.failed} fehlgeschlagen.`;
      if (results.skipped > 0) {
        message += ` ${results.skipped} Klassen übersprungen (keine Lehrer zugeordnet).`;
      }
    }

    const responseData = {
      message,
      results,
      timestamp: new Date().toISOString()
    };

    if (results.failed > 0) {
      console.warn('E-Mail-Versand teilweise fehlgeschlagen:', responseData);
      return res.status(207).json({ // 207 Multi-Status für teilweise Erfolg
        success: true,
        data: responseData
      });
    }

    return handleSuccess(res, responseData, message);

  } catch (error) {
    console.error('Unerwarteter Fehler beim E-Mail-Versand:', error);
    return handleError(res, error, 500, 'Unerwarteter Fehler beim Senden der E-Mails');
  }
}
