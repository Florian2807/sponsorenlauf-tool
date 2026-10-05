import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BaseDialog from '../../BaseDialog';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { useModuleConfig } from '../../../contexts/ModuleConfigContext';
import { useDonationDisplayMode } from '../../../contexts/DonationDisplayModeContext';

const ModuleSettingsDialog = ({ dialogRef }) => {
    const router = useRouter();
    const [localConfig, setLocalConfig] = useState({
        donations: false,
        emails: false,
        teachers: false,
        scannerStations: false,
        doubleScanPrevention: {
            enabled: true,
            timeThresholdMinutes: 5,
            mode: 'confirm'
        }
    });
    const [localDonationMode, setLocalDonationMode] = useState('expected');
    const [isLoading, setIsLoading] = useState(false);

    const { showError, showSuccess } = useGlobalError();
    const { config: globalConfig, updateConfig, isLoading: configLoading } = useModuleConfig();
    const { mode: globalDonationMode, updateMode: updateDonationMode } = useDonationDisplayMode();

    // Load current settings when dialog opens
    useEffect(() => {
        // Normalisiere die Konfiguration für Abwärtskompatibilität
        const normalizedConfig = {
            ...globalConfig,
            doubleScanPrevention: typeof globalConfig.doubleScanPrevention === 'boolean' 
                ? {
                    enabled: globalConfig.doubleScanPrevention,
                    timeThresholdMinutes: 5,
                    mode: 'confirm'
                }
                : globalConfig.doubleScanPrevention || {
                    enabled: true,
                    timeThresholdMinutes: 5,
                    mode: 'confirm'
                }
        };
        
        setLocalConfig(normalizedConfig);
        setLocalDonationMode(globalDonationMode);
    }, [globalConfig, globalDonationMode]);

    const handleSave = async (destination = null) => {
        try {
            setIsLoading(true);
            await updateConfig(localConfig);
            if (localConfig.donations) {
                await updateDonationMode(localDonationMode);
            }
            if (typeof destination !== 'string') showSuccess('Modul-Einstellungen erfolgreich gespeichert', 'Einstellungen');
            dialogRef.current.close();
            if (typeof destination === 'string') await router.push(destination);
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
        if (module === 'doubleScanPrevention') {
            setLocalConfig(prev => ({
                ...prev,
                doubleScanPrevention: {
                    ...prev.doubleScanPrevention,
                    enabled: enabled
                }
            }));
        } else {
            setLocalConfig(prev => ({
                ...prev,
                [module]: enabled
            }));
        }
    };

    const handleDoubleScanConfigChange = (setting, value) => {
        setLocalConfig(prev => ({
            ...prev,
            doubleScanPrevention: {
                enabled: true,
                timeThresholdMinutes: 5,
                mode: 'confirm',
                ...prev.doubleScanPrevention,
                [setting]: value
            }
        }));
    };

    const resetDraft = () => {
        setLocalConfig({ ...globalConfig, doubleScanPrevention: globalConfig.doubleScanPrevention || {
            enabled: true, timeThresholdMinutes: 5, mode: 'confirm',
        } });
        setLocalDonationMode(globalDonationMode);
    };
    const modules = [
        { id: 'doubleScanPrevention', title: 'Doppel-Scan-Schutz', icon: 'fa-shield-halved', subtitle: 'Erkennt zu schnell wiederholte Scans und schützt vor versehentlich doppelt gezählten Runden.', features: [
            'Mindestabstand zwischen zwei Scans derselben Person festlegen',
            'Bei einem erneuten Scan eine Bestätigung verlangen oder die Runde blockieren',
        ], example: 'Ein Barcode wird zweimal direkt hintereinander gescannt: Die zweite Runde braucht eine Bestätigung oder wird abgewiesen.' },
        { id: 'scannerStations', title: 'Scanner-Stationen', icon: 'fa-laptop', subtitle: 'Für mehrere Scan-Laptops: Klassen auf Stationen verteilen und sehen, wo gescannt wurde.', features: [
            'Station am Laptop auswählen; mehrere Laptops können dieselbe Station nutzen',
            'Andere Klassen mit Hinweis zählen oder blockieren; jeder Helfer kann die Regeln einstellen',
            'Stationsnamen in Scan-Zeitstempeln und Doppel-Scan-Meldungen sehen',
        ], exampleTitle: 'Zum Beispiel am Ziel', example: '„Ziel links“ betreut Jahrgang 5, „Ziel rechts“ Jahrgang 6. Ein Scan an der falschen Station kann mit einem Hinweis trotzdem zählen.' },
        { id: 'donations', title: 'Spenden', icon: 'fa-coins', subtitle: 'Zeigt, welche Spenden zugesagt wurden und welche bereits eingegangen sind.', features: [
            'Zugesagte und eingegangene Beträge erfassen',
            'Spendenwerte in Auswertungen anzeigen und exportieren',
        ] },
        { id: 'emails', title: 'E-Mails', icon: 'fa-envelope', subtitle: 'Versendet die Klassenergebnisse nach dem Lauf direkt an die zuständigen Lehrer.', features: [
            'Klassen und Empfänger auswählen und Ergebnisse versenden',
            'Versand über Microsoft 365 oder einen SMTP-Mailserver einrichten',
        ] },
        { id: 'teachers', title: 'Lehrerverwaltung', icon: 'fa-chalkboard-user', subtitle: 'Speichert Lehrer und ihre Klassen, damit die passenden Kontakte schnell zur Hand sind.', features: [
            'Namen, E-Mail-Adressen und Klassenzuordnungen pflegen',
            'Gespeicherte Lehrer beim E-Mail-Versand als Empfänger auswählen',
        ] },
    ];
    const disabled = isLoading || configLoading;
    const threshold = localConfig.doubleScanPrevention?.timeThresholdMinutes;
    const invalidThreshold = localConfig.doubleScanPrevention?.enabled && (!Number.isInteger(threshold) || threshold < 1 || threshold > 60);
    const actions = [
        { label: 'Abbrechen', variant: 'secondary', position: 'left', onClick: handleClose, disabled },
        { label: isLoading ? 'Speichere …' : 'Speichern', position: 'right', onClick: () => handleSave(), disabled: disabled || invalidThreshold },
    ];

    return <BaseDialog dialogRef={dialogRef} title="Module verwalten" actions={actions} size="xl"
        showDefaultClose={false} className="module-settings-dialog module-manager" onClose={resetDraft}>
        <p className="module-manager-description">Wähle die Funktionen für deinen Sponsorenlauf. Änderungen gelten nach dem Speichern.</p>
        <div className="module-manager-list">
            {modules.map((module) => {
                const active = module.id === 'doubleScanPrevention' ? localConfig.doubleScanPrevention?.enabled === true : localConfig[module.id] === true;
                return <section key={module.id} className="module-manager-item" aria-label={module.title}>
                    <div className="module-manager-row">
                        <span className="module-manager-icon"><i className={`fa-solid ${module.icon}`} aria-hidden="true" /></span>
                        <div className="module-manager-copy"><h3>{module.title}</h3><p>{module.subtitle}</p></div>
                        <span className={`module-manager-state ${active ? 'is-active' : ''}`}>{active ? 'Aktiv' : 'Aus'}</span>
                        <label className="module-toggle">
                            <input type="checkbox" aria-label={`${module.title} aktivieren`} checked={active} disabled={disabled}
                                onChange={(event) => handleModuleChange(module.id, event.target.checked)} />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                    <div className="module-manager-content">
                        <details className="module-manager-details">
                            <summary>Enthaltene Features:</summary>
                            <ul>{module.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                            {module.example && <div className="module-manager-example">
                                <strong><i className="fa-regular fa-lightbulb" aria-hidden="true" /> {module.exampleTitle || 'Zum Beispiel'}</strong>
                                <p>{module.example}</p>
                            </div>}
                        </details>
                        {module.id === 'scannerStations' && active && <button type="button" className="module-manager-setup" disabled={disabled || invalidThreshold}
                            onClick={() => handleSave('/stations')}>Speichern & Stationen einrichten <i className="fa-solid fa-arrow-right" aria-hidden="true" /></button>}
                        {module.id === 'donations' && active && <fieldset className="module-manager-options" disabled={disabled}>
                            <legend>Spendenwerte in Auswertungen</legend>
                            <div className="module-manager-radios">
                                {[['expected', 'Erwartete Spenden'], ['received', 'Erhaltene Spenden']].map(([value, label]) => <label key={value}>
                                    <input type="radio" name="donationDisplayMode" value={value} checked={localDonationMode === value} onChange={() => setLocalDonationMode(value)} />{label}
                                </label>)}
                            </div>
                        </fieldset>}
                        {module.id === 'doubleScanPrevention' && active && <fieldset className="module-manager-options" disabled={disabled}>
                            <legend>Verhalten beim Scannen</legend>
                            <div className="module-manager-threshold"><label htmlFor="timeThreshold">Mindestabstand</label>
                                <input id="timeThreshold" type="number" min="1" max="60" aria-invalid={invalidThreshold || undefined} aria-describedby={invalidThreshold ? 'module-threshold-error' : undefined} value={localConfig.doubleScanPrevention?.timeThresholdMinutes ?? ''}
                                    onChange={(event) => handleDoubleScanConfigChange('timeThresholdMinutes', event.target.value === '' ? '' : Number(event.target.value))} />
                                <span>Minuten</span>
                            </div>
                            {invalidThreshold && <p id="module-threshold-error" className="module-manager-error" role="alert">Bitte eine ganze Zahl zwischen 1 und 60 eingeben.</p>}
                            <div className="module-manager-radios">
                                {[['confirm', 'Bestätigung verlangen'], ['block', 'Runde blockieren']].map(([value, label]) => <label key={value}>
                                    <input type="radio" name="doubleScanMode" value={value} checked={localConfig.doubleScanPrevention?.mode === value} onChange={() => handleDoubleScanConfigChange('mode', value)} />{label}
                                </label>)}
                            </div>
                        </fieldset>}
                        {module.id === 'doubleScanPrevention' && !active && <p className="module-manager-note">Ohne Schutz können direkt aufeinanderfolgende Scans mehrere Runden zählen.</p>}
                    </div>
                </section>;
            })}
        </div>
    </BaseDialog>;
};

export default ModuleSettingsDialog;
