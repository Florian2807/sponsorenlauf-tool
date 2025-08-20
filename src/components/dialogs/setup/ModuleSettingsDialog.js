import React, { useState, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { useModuleConfig } from '../../../contexts/ModuleConfigContext';
import { useDonationDisplayMode } from '../../../contexts/DonationDisplayModeContext';

const ModuleSettingsDialog = ({ dialogRef }) => {
    const [localConfig, setLocalConfig] = useState({
        donations: true,
        emails: true,
        teachers: true
    });
    const [localDonationMode, setLocalDonationMode] = useState('expected');
    const [isLoading, setIsLoading] = useState(false);

    const { showError, showSuccess } = useGlobalError();
    const { config: globalConfig, updateConfig } = useModuleConfig();
    const { mode: globalDonationMode, updateMode: updateDonationMode } = useDonationDisplayMode();

    // Load current settings when dialog opens
    useEffect(() => {
        setLocalConfig(globalConfig);
        setLocalDonationMode(globalDonationMode);
    }, [globalConfig, globalDonationMode]);

    const handleSave = async () => {
        try {
            setIsLoading(true);
            await updateConfig(localConfig);
            if (localConfig.donations) {
                await updateDonationMode(localDonationMode);
            }
            showSuccess('Modul-Einstellungen erfolgreich gespeichert', 'Einstellungen');
            dialogRef.current?.close();
        } catch (error) {
            showError(error, 'Beim Speichern der Modul-Einstellungen');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        dialogRef.current?.close();
    };

    const handleModuleChange = (module, enabled) => {
        setLocalConfig(prev => ({
            ...prev,
            [module]: enabled
        }));
    };

    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: handleClose,
            disabled: isLoading
        },
        {
            label: isLoading ? 'Speichere...' : 'Speichern',
            variant: 'success',
            position: 'right',
            onClick: handleSave,
            disabled: isLoading
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="🔧 Modul-Einstellungen"
            actions={actions}
            size="xl"
            showDefaultClose={false}
            className="module-settings-dialog"
        >
            <div className="dialog-content">
                <div className="module-settings-header">
                    <h3 className="section-title">Module verwalten</h3>
                    <p className="dialog-description">
                        Aktivieren oder deaktivieren Sie einzelne Features der Anwendung.
                        Änderungen wirken sich sofort auf die gesamte Anwendung aus.
                    </p>
                </div>

                <div className="module-settings-grid">
                    <div className="module-card">
                        <div className="module-card-header">
                            <div className="module-icon">💰</div>
                            <div className="module-header-content">
                                <h4 className="module-title">Spenden-Modul</h4>
                                <p className="module-subtitle">Verwaltung von Spendengeldern</p>
                            </div>
                            <label className="module-toggle">
                                <input
                                    type="checkbox"
                                    checked={localConfig.donations}
                                    onChange={(e) => handleModuleChange('donations', e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="module-card-content">
                            <div className="module-features">
                                <h5>Enthaltene Features:</h5>
                                <ul>
                                    <li>📊 Spenden-Statistiken in allen Auswertungen</li>
                                    <li>💰 Spenden-Verwaltungsseite</li>
                                    <li>📈 Spenden-Export Funktionen</li>
                                    <li>⚙️ Spenden-Anzeigemodus (Erwartet/Erhalten)</li>
                                    <li>📋 Spenden-Spalten in Tabellen</li>
                                </ul>
                            </div>

                            {!localConfig.donations && (
                                <div className="module-warning">
                                    <div className="warning-icon">⚠️</div>
                                    <div className="warning-content">
                                        <strong>Achtung bei Deaktivierung:</strong>
                                        <p>Alle spendenbezogenen Features werden komplett aus der Anwendung entfernt. Dies betrifft Statistiken, Export-Funktionen und die gesamte Spenden-Verwaltung.</p>
                                    </div>
                                </div>
                            )}

                            {localConfig.donations && (
                                <div className="module-sub-settings">
                                    <h6 className="sub-settings-title">Spenden-Anzeigemodus:</h6>
                                    <div className="radio-group-compact">
                                        <label className="radio-option-compact">
                                            <input
                                                type="radio"
                                                name="donationDisplayMode"
                                                value="expected"
                                                checked={localDonationMode === 'expected'}
                                                onChange={(e) => setLocalDonationMode(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <span className="radio-dot"></span>
                                            <span className="radio-text">Erwartete Spenden anzeigen</span>
                                        </label>
                                        <label className="radio-option-compact">
                                            <input
                                                type="radio"
                                                name="donationDisplayMode"
                                                value="received"
                                                checked={localDonationMode === 'received'}
                                                onChange={(e) => setLocalDonationMode(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <span className="radio-dot"></span>
                                            <span className="radio-text">Erhaltene Spenden anzeigen</span>
                                        </label>
                                    </div>
                                    <p className="sub-settings-description">
                                        Bestimmt, welche Spendenwerte in allen Statistiken und Exporten angezeigt werden.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="module-card">
                        <div className="module-card-header">
                            <div className="module-icon">📧</div>
                            <div className="module-header-content">
                                <h4 className="module-title">E-Mail-Modul</h4>
                                <p className="module-subtitle">Automatischer E-Mail-Versand</p>
                            </div>
                            <label className="module-toggle">
                                <input
                                    type="checkbox"
                                    checked={localConfig.emails}
                                    onChange={(e) => handleModuleChange('emails', e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="module-card-content">
                            <div className="module-features">
                                <h5>Enthaltene Features:</h5>
                                <ul>
                                    <li>📧 Automatischer E-Mail-Versand an Lehrer</li>
                                    <li>📋 Rundenergebnisse per E-Mail</li>
                                    <li> E-Mail-Reports und Statistiken</li>
                                    <li>⚙️ E-Mail-Konfiguration im Setup</li>
                                </ul>
                            </div>

                            {!localConfig.emails && (
                                <div className="module-warning">
                                    <div className="warning-icon">⚠️</div>
                                    <div className="warning-content">
                                        <strong>Achtung bei Deaktivierung:</strong>
                                        <p>Alle E-Mail-Funktionen werden deaktiviert. Lehrer erhalten keine automatischen Benachrichtigungen mehr über Rundenergebnisse.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="module-card">
                        <div className="module-card-header">
                            <div className="module-icon">👨‍🏫</div>
                            <div className="module-header-content">
                                <h4 className="module-title">Lehrer-Modul</h4>
                                <p className="module-subtitle">Lehrerverwaltung und -zuordnung</p>
                            </div>
                            <label className="module-toggle">
                                <input
                                    type="checkbox"
                                    checked={localConfig.teachers}
                                    onChange={(e) => handleModuleChange('teachers', e.target.checked)}
                                    disabled={isLoading}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="module-card-content">
                            <div className="module-features">
                                <h5>Enthaltene Features:</h5>
                                <ul>
                                    <li>👨‍🏫 Lehrer-Verwaltungsseite</li>
                                    <li>📧 E-Mail-Adressen der Lehrer verwalten</li>
                                    <li>🏫 Klassenzuordnung zu Lehrern</li>
                                    <li>⚙️ Lehrer-Setup im Setup-Bereich</li>
                                    <li>📊 Lehrer-bezogene Funktionen</li>
                                </ul>
                            </div>

                            {!localConfig.teachers && (
                                <div className="module-warning">
                                    <div className="warning-icon">⚠️</div>
                                    <div className="warning-content">
                                        <strong>Achtung bei Deaktivierung:</strong>
                                        <p>Die komplette Lehrerverwaltung wird deaktiviert. E-Mail-Zuordnungen und Klassenzuweisungen werden ausgeblendet.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="module-settings-footer">
                    <div className="info-box">
                        <div className="info-icon">💡</div>
                        <div className="info-content">
                            <strong>Hinweis zur Modul-Verwaltung:</strong>
                            <p>
                                Diese Einstellungen steuern die Verfügbarkeit von Features in der gesamten Anwendung.
                                Deaktivierte Module werden sofort ausgeblendet und deren Funktionen sind nicht mehr zugänglich.
                                Sie können Module jederzeit wieder aktivieren.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </BaseDialog>
    );
};

export default ModuleSettingsDialog;
