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
                                <div className="html-preview">
                                    <div style={{ padding: 20, textAlign: 'center' }}>
                                        <h1>🏃‍♂️ Sponsorenlauf {currentYear}</h1>
                                        <p>Ergebnisliste Klasse [KLASSENNAME]</p>
                                    </div>
                                    <div style={{ padding: 30 }}>
                                        <div style={{ whiteSpace: 'pre-wrap', marginBottom: 20 }}>{mailText}</div>
                                        <div style={{ padding: 15, margin: '20px 0' }}>
                                            <p><strong>📎 Anhang:</strong></p>
                                            <p>Excel-Datei mit den Laufergebnissen der Schüler</p>
                                        </div>
                                        <p style={{ textAlign: 'center', fontSize: 12 }}>
                                            Diese E-Mail wurde automatisch generiert • {new Date().toLocaleDateString('de-DE')}
                                        </p>
                                    </div>
                                </div>
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
