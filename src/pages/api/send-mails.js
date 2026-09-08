import { handleMethodNotAllowed, handleError, handleSuccess, handleValidationError } from '../../utils/apiHelpers.js';
import { validateEmail } from '../../utils/validation.js';
import { getConfiguredSmtpTransport } from '../../utils/smtpService.js';

const applyTemplateVariables = (mailText, className, currentYear) => {
  return mailText
    .replaceAll('{jahr}', String(currentYear))
    .replaceAll('{klasse}', className);
};

const MAX_CLASSES_PER_SEND = 100;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 30 * 1024 * 1024;

const escapeHtml = (value) => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const sendClassEmail = async (transporter, className, teacherData, classFileBase64, mailText, mailSubject, senderName, senderEmail, sendCopyToSender = false) => {
  if (!classFileBase64 || !teacherData.length) {
    console.warn(`Überspringe Klasse ${className}: Keine Datei oder Lehrer`);
    return false;
  }

  const teacherEmails = [...new Map(
    teacherData
      .map(teacher => String(teacher.email || '').trim())
      .filter(Boolean)
      .map(email => [email.toLocaleLowerCase(), email])
  ).values()];

  if (teacherEmails.length === 0) {
    console.warn(`Überspringe Klasse ${className}: Keine gültigen E-Mail-Adressen`);
    return false;
  }

  const currentYear = new Date().getFullYear();
  const resolvedMailText = applyTemplateVariables(mailText, className, currentYear);
  const resolvedSubject = applyTemplateVariables(mailSubject, className, currentYear);
  const resolvedMailHtml = escapeHtml(resolvedMailText).replace(/\n/g, '<br>');
  const mailOptions = {
    from: `${senderName} <${senderEmail}>`,
    to: teacherEmails[0],
    cc: teacherEmails.slice(1).join(', '),
    subject: resolvedSubject,
    text: resolvedMailText,
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
${resolvedMailHtml}
              </div>
              
            <!-- Attachment Info -->
            <div class="attachment-box" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 16px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                  📎
                </div>
                <div style="flex: 1; min-width: 0;">
                  <h3 class="accent-color" style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #3b82f6;">
                    📎 Ihre Excel-Datei ist angehängt
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
        contentDisposition: 'attachment',
      },
    ],
  };

  // Optionale Kopie an Absender hinzufügen
  if (sendCopyToSender) {
    mailOptions.bcc = senderEmail;
  }

  try {
    await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    console.error(`Fehler beim Senden der E-Mail für Klasse ${className}:`, error);
    throw error;
  }
};

const validateEmailData = (teacherData, teacherFiles, mailText, mailSubject) => {
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

  if (!mailText?.trim()) {
    errors.push('E-Mail-Text ist erforderlich');
  }

  if (mailText && mailText.length > 10000) {
    errors.push('E-Mail-Text ist zu lang (maximal 10.000 Zeichen)');
  }

  if (!mailSubject?.trim()) errors.push('E-Mail-Betreff ist erforderlich');
  if (mailSubject && mailSubject.length > 200) errors.push('E-Mail-Betreff ist zu lang (maximal 200 Zeichen)');
  if (mailSubject && /[\r\n]/.test(mailSubject)) errors.push('E-Mail-Betreff darf keinen Zeilenumbruch enthalten');

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
    const classNames = Object.keys(teacherData);
    if (classNames.length > MAX_CLASSES_PER_SEND) {
      errors.push(`Zu viele Klassen in einem Versand (maximal ${MAX_CLASSES_PER_SEND})`);
    }

    let totalAttachmentBytes = 0;
    Object.keys(teacherData).forEach(className => {
      // Nur prüfen wenn Klasse Lehrer hat
      if (teacherData[className] && Array.isArray(teacherData[className]) && teacherData[className].length > 0) {
        if (teacherFiles[className]) {
          const estimatedBytes = Math.ceil(String(teacherFiles[className]).length * 0.75);
          totalAttachmentBytes += estimatedBytes;
          if (estimatedBytes > MAX_ATTACHMENT_BYTES) errors.push(`Klasse ${className}: Anhang ist zu groß`);
        }
      }
    });
    if (totalAttachmentBytes > MAX_TOTAL_ATTACHMENT_BYTES) errors.push('Anhänge sind insgesamt zu groß');
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
      mailText,
      mailSubject = 'Sponsorenlauf {jahr} - Ergebnisliste Klasse {klasse}',
      sendCopyToSender = false
    } = req.body;

    // Validierung der Eingabedaten
    const validationErrors = validateEmailData(
      teacherData,
      teacherFiles,
      mailText,
      mailSubject
    );

    if (validationErrors.length > 0) {
      console.warn('Validierungsfehler:', validationErrors);
      return handleValidationError(res, validationErrors);
    }

    const { configuration: smtpConfiguration, transporter } = await getConfiguredSmtpTransport();

    try {
      await transporter.verify();
    } catch (verifyError) {
      transporter.close?.();
      console.error('E-Mail-Server-Verbindung fehlgeschlagen:', verifyError);
      return handleError(res, verifyError, 401, 'E-Mail-Server-Verbindung fehlgeschlagen. Überprüfen Sie Ihre Anmeldedaten.');
    }

    // E-Mails versenden - nur für Klassen mit Lehrern
    const allClassNames = Object.keys(teacherData);
    const classNamesWithTeachers = allClassNames.filter(className => {
      const teachers = teacherData[className];
      return Array.isArray(teachers) && teachers.length > 0 && teachers.some(teacher => teacher.email);
    });
    const classNamesWithoutFiles = classNamesWithTeachers.filter(className => !teacherFiles[className]);
    const classNamesToSend = classNamesWithTeachers.filter(className => Boolean(teacherFiles[className]));

    const results = {
      total: allClassNames.length,
      processed: classNamesToSend.length,
      skipped: allClassNames.length - classNamesToSend.length,
      successful: 0,
      failed: 0,
      errors: [],
      skippedClasses: allClassNames.filter(className => !classNamesToSend.includes(className)),
      skippedDetails: [
        ...allClassNames.filter(className => !classNamesWithTeachers.includes(className)).map(className => ({ className, reason: 'Keine Empfänger zugeordnet' })),
        ...classNamesWithoutFiles.map(className => ({ className, reason: 'Keine Ergebnisliste verfügbar' })),
      ],
    };

    // Log übersprungene Klassen
    if (results.skipped > 0) {
      console.log(`Überspringe ${results.skipped} Klassen ohne Lehrer-Zuordnungen:`, results.skippedClasses);
    }

    for (const [classIndex, className] of classNamesToSend.entries()) {
      try {
        const success = await sendClassEmail(
          transporter,
          className,
          teacherData[className],
          teacherFiles[className],
          mailText,
          mailSubject,
          smtpConfiguration.fromName,
          smtpConfiguration.fromAddress,
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
      if (classIndex < classNamesToSend.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    transporter.close?.();

    // Ergebnis zurückgeben
    let message;
    if (results.failed === 0 && results.skipped === 0) {
      message = `Alle ${results.successful} E-Mails wurden erfolgreich versendet!`;
    } else if (results.failed === 0) {
      message = `${results.successful} E-Mails erfolgreich versendet. ${results.skipped} Klassen wurden übersprungen.`;
    } else {
      message = `${results.successful} von ${results.processed} E-Mails erfolgreich versendet. ${results.failed} fehlgeschlagen.`;
      if (results.skipped > 0) {
        message += ` ${results.skipped} Klassen wurden übersprungen.`;
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

export const config = {
  api: { bodyParser: { sizeLimit: '45mb' } },
};
