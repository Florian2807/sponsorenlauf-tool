import React, { useState, useEffect } from 'react';
import BaseDialog from '../../BaseDialog';
import { useApi } from '../../../hooks/useApi';
import { useGlobalError } from '../../../contexts/ErrorContext';
import { useDonationDisplayMode } from '../../../contexts/DonationDisplayModeContext';

const DonationSettingsDialog = ({ dialogRef }) => {
  const [localMode, setLocalMode] = useState('expected');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const { request } = useApi();
  const { showError, showSuccess } = useGlobalError();
  const { mode: globalMode, updateMode } = useDonationDisplayMode();

  // Load current settings when dialog opens
  useEffect(() => {
    setLocalMode(globalMode);
    setInitialLoad(false);
  }, [globalMode]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateMode(localMode);
      showSuccess('Spenden-Einstellungen erfolgreich gespeichert', 'Einstellungen');
      dialogRef.current?.close();
    } catch (error) {
      showError(error, 'Beim Speichern der Spenden-Einstellungen');
    } finally {
      setIsLoading(false);
    }
  }; const handleClose = () => {
    dialogRef.current?.close();
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
      title="Spenden-Anzeigeeinstellungen"
      actions={actions}
      size="large"
      showDefaultClose={false}
      className="donation-settings-dialog"
    >
      <div className="dialog-content">
        <p className="dialog-description">
          Wählen Sie aus, welche Spendenwerte in den Statistiken und Exporten angezeigt werden sollen:
        </p>
        {isLoading && initialLoad ? (
          <div className="loading-spinner">
            <p>Einstellungen werden geladen...</p>
          </div>
        ) : (
          <div className="donation-settings-options">
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="donationDisplayMode"
                  value="expected"
                  checked={localMode === 'expected'}
                  onChange={(e) => setLocalMode(e.target.value)}
                  disabled={isLoading}
                />
                <span className="radio-label">
                  <strong>Erwartete Spenden anzeigen</strong>
                  <small className="radio-description">
                    Zeigt die berechneten erwarteten Spendensummen basierend auf den gelaufenen Runden an.
                    Diese werden automatisch aus den Rundenzahlen und Spendenzusagen berechnet.
                  </small>
                </span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="donationDisplayMode"
                  value="received"
                  checked={localMode === 'received'}
                  onChange={(e) => setLocalMode(e.target.value)}
                  disabled={isLoading}
                />
                <span className="radio-label">
                  <strong>Erhaltene Spenden anzeigen</strong>
                  <small className="radio-description">
                    Zeigt die tatsächlich eingegangenen und manuell eingetragenen Spendensummen an.
                    Diese müssen separat über die Spenden-Verwaltung eingepflegt werden.
                  </small>
                </span>
              </label>
            </div>

            <div className="settings-info">
              <div className="info-box">
                <strong>💡 Hinweis:</strong>
                <p>
                  Diese Einstellung beeinflusst alle Statistiken, Exporte und E-Mail-Berichte.
                  Sie können jederzeit zwischen den Modi wechseln.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

export default DonationSettingsDialog;
