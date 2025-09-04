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

const sendClassEmail = async (transporter, className, teacherData, classFileBase64, mailText, senderName, senderEmail, sendCopyToSender = false) => {
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
    subject: `Sponsorenlauf ${currentYear} - Ergebnisliste Klasse ${className}`,
    text: mailText,
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sponsorenlauf ${currentYear} - Klasse ${className}</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
          }
          
          .container {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background-color: #ffffff;
            color: #3b82f6;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .mail-text {
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .attachment-box {
            background-color: #f1f5f9;
            border: 1px solid #e2e8f0;
          }
          
          .accent-color {
            color: #3b82f6;
          }
          
          .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; text-size-adjust: 100;">
        <div class="email-container no-scale" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; min-height: 100vh;">
          
          <!-- Main wrapper -->
          <div class="email-wrapper no-scale" style="max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div class="header" style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 35px 30px; text-align: center;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;">
                🏃‍♂️ Sponsorenlauf ${currentYear}
              </h1>
              <p style="color: #3b82f6; margin: 15px 0 0 0; font-size: 18px; font-weight: 400; line-height: 1.3;">
                Ergebnisliste Klasse ${className}
              </p>
            </div>
            
            <!-- Main Content -->
            <div class="content" style="padding: 40px 30px;">
              
              <!-- Mail Text -->
              <div class="mail-text" style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 32px; border-radius: 4px; font-size: 15px; line-height: 1.6; word-wrap: break-word; overflow-wrap: break-word;">
${mailText.replace(/\n/g, '<br>')}
              </div>
              
            <!-- Attachment Info -->
            <div class="attachment-box" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 16px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                  📎
                </div>
                <div style="flex: 1; min-width: 0;">
                  <h3 class="accent-color" style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #3b82f6;">
                    📊 Excel-Datei im Anhang
                  </h3>
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #64748b; word-wrap: break-word;">
                    Sponsorenlauf_${currentYear}_Klasse_${className}.xlsx
                  </p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                    Die Datei enthält alle Laufergebnisse und Spendenbeträge Ihrer Klasse.
                  </p>
                </div>
              </div>
            
            <!-- Support Info -->
            <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">
                <strong>❓ Fragen oder Probleme?</strong><br>
                Bei Fragen wenden Sie sich an die Schülervertretung oder antworten Sie direkt auf diese E-Mail.
              </p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div class="footer" style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; line-height: 1.4; color: #64748b;">
              Automatisch generiert vom Sponsorenlauf-Verwaltungssystem
            </p>
            <p class="accent-color" style="margin: 0; font-size: 12px; font-weight: 500; color: #3b82f6;">
              📅 ${new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
            </p>
          </div>
          
        </div>
        
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `Sponsorenlauf_${currentYear}_Klasse_${className}.xlsx`,
        content: Buffer.from(classFileBase64, 'base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  };

  // Optionale Kopie an Absender hinzufügen
  if (sendCopyToSender) {
    mailOptions.bcc = senderEmail;
  }

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
      emailProvider = 'outlook',
      sendCopyToSender = false
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
          email,
          sendCopyToSender
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
