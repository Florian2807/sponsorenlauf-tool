import React from 'react';
import BaseDialog from '../../BaseDialog';

const ExportSpendenDialog = ({
    dialogRef,
    downloadResults,
    loading
}) => {
    const actions = [
        {
            label: 'Schließen',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Gesamtauswertung',
            variant: 'success',
            onClick: () => downloadResults('allstudents'),
            disabled: loading.downloadResults
        },
        {
            label: 'Klassenweise Auswertung',
            variant: 'success',
            onClick: () => downloadResults('classes'),
            disabled: loading.downloadResults
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Spenden Auswertungen downloaden"
            actions={actions}
            size='large'
            showDefaultClose={false}
        >
            {loading.downloadResults && <div className="progress-bar" />}
        </BaseDialog>
    );
};

export default ExportSpendenDialog;
