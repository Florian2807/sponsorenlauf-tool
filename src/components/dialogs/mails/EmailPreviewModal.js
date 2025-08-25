import React, { useState } from 'react';

const EmailPreviewModal = ({ 
    isOpen, 
    onClose, 
    mailText, 
    senderName, 
    teacherSummary, 
    onConfirmSend 
}) => {
    const [isConfirming, setIsConfirming] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        setIsConfirming(true);
        onConfirmSend();
    };

    const currentYear = new Date().getFullYear();
    const { classCount, teacherCount } = teacherSummary;

    // Simuliere HTML-Mail Vorschau
    const htmlPreview = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4a90e2, #357abd); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🏃‍♂️ Sponsorenlauf ${currentYear}</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Ergebnisliste Klasse [KLASSENNAME]</p>
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
    `;

    return (
        <div className="email-preview-overlay">
            <div className="email-preview-modal">
                <div className="preview-header">
                    <h2>
                        <i className="icon-preview"></i>
                        E-Mail Vorschau
                    </h2>
                    <button 
                        className="close-button"
                        onClick={onClose}
                        disabled={isConfirming}
                    >
                        <i className="icon-x"></i>
                    </button>
                </div>

                <div className="preview-content">
                    <div className="email-meta">
                        <div className="meta-item">
                            <label>Von:</label>
                            <span>{senderName}</span>
                        </div>
                        <div className="meta-item">
                            <label>Betreff:</label>
                            <span>Sponsorenlauf {currentYear} - Ergebnisliste Klasse [KLASSENNAME]</span>
                        </div>
                        <div className="meta-item">
                            <label>Empfänger:</label>
                            <span>{teacherCount} Lehrer in {classCount} Klassen</span>
                        </div>
                    </div>

                    <div className="preview-tabs">
                        <div className="tab-buttons">
                            <button className="tab-button active">
                                <i className="icon-eye"></i>
                                Vorschau
                            </button>
                            <button className="tab-button">
                                <i className="icon-code"></i>
                                Quelltext
                            </button>
                        </div>

                        <div className="tab-content">
                            <div className="email-preview-frame">
                                <div 
                                    className="html-preview"
                                    dangerouslySetInnerHTML={{ __html: htmlPreview }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="validation-summary">
                        <h3>
                            <i className="icon-check-list"></i>
                            Sendung-Validierung
                        </h3>
                        <div className="validation-checks">
                            <div className="check-item success">
                                <i className="icon-check"></i>
                                <span>E-Mail-Text vorhanden ({mailText.length} Zeichen)</span>
                            </div>
                            <div className="check-item success">
                                <i className="icon-check"></i>
                                <span>Absender konfiguriert ({senderName})</span>
                            </div>
                            <div className="check-item success">
                                <i className="icon-check"></i>
                                <span>{teacherCount} gültige Empfänger-Adressen</span>
                            </div>
                            <div className="check-item success">
                                <i className="icon-check"></i>
                                <span>{classCount} Excel-Anhänge bereit</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="preview-actions">
                    <button 
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isConfirming}
                    >
                        Bearbeiten
                    </button>
                    <button 
                        className="btn btn-success send-confirm-btn"
                        onClick={handleConfirm}
                        disabled={isConfirming}
                    >
                        <i className="icon-send"></i>
                        {isConfirming ? 'Wird gesendet...' : `${teacherCount} E-Mails senden`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailPreviewModal;
