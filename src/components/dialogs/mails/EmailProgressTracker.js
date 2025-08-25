import React from 'react';

const EmailProgressTracker = ({
    isActive,
    progress,
    currentClass,
    totalClasses,
    successCount,
    errorCount,
    errors = []
}) => {
    if (!isActive) return null;

    const progressPercentage = Math.round((progress / totalClasses) * 100);

    return (
        <div className="email-progress-tracker">
            <div className="progress-header">
                <h3>
                    <i className="icon-mail-send"></i>
                    E-Mail-Versand läuft...
                </h3>
                <div className="progress-stats">
                    <span className="stat success">
                        <i className="icon-check-circle"></i>
                        {successCount} erfolgreich
                    </span>
                    {errorCount > 0 && (
                        <span className="stat error">
                            <i className="icon-alert-circle"></i>
                            {errorCount} fehlgeschlagen
                        </span>
                    )}
                </div>
            </div>

            <div className="progress-content">
                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="progress-text">
                        {progress} von {totalClasses} Klassen ({progressPercentage}%)
                    </div>
                </div>

                {currentClass && (
                    <div className="current-class">
                        <i className="icon-clock"></i>
                        Verarbeite gerade: <strong>Klasse {currentClass}</strong>
                    </div>
                )}

                <div className="progress-details">
                    <div className="detail-item">
                        <i className="icon-users"></i>
                        <span>Klassen gesamt: {totalClasses}</span>
                    </div>
                    <div className="detail-item">
                        <i className="icon-check"></i>
                        <span>Erfolgreich: {successCount}</span>
                    </div>
                    {errorCount > 0 && (
                        <div className="detail-item error">
                            <i className="icon-x-circle"></i>
                            <span>Fehlgeschlagen: {errorCount}</span>
                        </div>
                    )}
                </div>

                {errors.length > 0 && (
                    <div className="progress-errors">
                        <h4>
                            <i className="icon-alert-triangle"></i>
                            Fehler beim Versand:
                        </h4>
                        <ul className="error-list">
                            {errors.slice(-5).map((error, index) => (
                                <li key={index} className="error-item">
                                    {error}
                                </li>
                            ))}
                        </ul>
                        {errors.length > 5 && (
                            <p className="error-more">
                                ... und {errors.length - 5} weitere Fehler
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="progress-tips">
                <div className="tip">
                    <i className="icon-info"></i>
                    <span>
                        Bitte schließen Sie das Fenster nicht, während E-Mails gesendet werden.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EmailProgressTracker;
