import React from 'react';
import BaseDialog from '../../BaseDialog';

const DoubleScanConfirmationDialog = ({ 
  dialogRef, 
  studentInfo, 
  lastRoundTime,
  thresholdMinutes = 5,
  onConfirm, 
  onCancel 
}) => {
  const formatTimeDiff = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes} Minute${minutes !== 1 ? 'n' : ''} und ${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
    }
    return `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
  };

  const actions = [
    {
      label: 'Abbrechen',
      onClick: onCancel,
      variant: 'secondary',
      position: 'left'
    },
    {
      label: 'Runde trotzdem zählen',
      onClick: onConfirm,
      variant: 'primary',
      position: 'right'
    }
  ];

  return (
    <BaseDialog
      dialogRef={dialogRef}
      title="Doppel-Scan Warnung"
      size="medium"
      actions={actions}
      showDefaultClose={false}
    >
      <div className="double-scan-content">
        {/* Hauptwarnung */}
        <div className="scan-alert">
          <div className="alert-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="alert-content">
            <h3 className="alert-title">Zu schneller Scan erkannt</h3>
            <p className="alert-message">
              <span className="student-highlight">{studentInfo?.vorname} {studentInfo?.nachname}</span>{' '}
              wurde bereits vor{' '}
              <span className="time-highlight">{formatTimeDiff(lastRoundTime)}</span>{' '}
              gescannt.
            </p>
          </div>
        </div>

        {/* Schüler Info Card */}
        <div className="student-card">
          <div className="card-header">
            <div className="student-avatar">
              {studentInfo?.vorname?.[0]}{studentInfo?.nachname?.[0]}
            </div>
            <div className="student-basic-info">
              <h4 className="student-full-name">{studentInfo?.vorname} {studentInfo?.nachname}</h4>
              <p className="student-class">Klasse {studentInfo?.klasse}</p>
            </div>
          </div>
          
          <div className="card-stats">
            <div className="stat-item">
              <div className="stat-number">{studentInfo?.roundCount || 0}</div>
              <div className="stat-label">Runden heute</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">{thresholdMinutes}</div>
              <div className="stat-label">Min. Abstand</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-time">{new Date(lastRoundTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="stat-label">Letzte Runde</div>
            </div>
          </div>
        </div>

        {/* Entscheidung */}
        <div className="decision-box">
          <h4 className="decision-title">Was möchten Sie tun?</h4>
          <p className="decision-subtitle">
            War dies ein versehentlicher Doppel-Scan oder soll die Runde gezählt werden?
          </p>
        </div>
      </div>
    </BaseDialog>
  );
};

export default DoubleScanConfirmationDialog;
