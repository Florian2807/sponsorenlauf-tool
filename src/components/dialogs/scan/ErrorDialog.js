import React from 'react';
import BaseDialog from '../../BaseDialog';

const ErrorDialog = ({ dialogRef }) => {
    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Fehler"
        >
            <p>Klicke auf das Eingabefeld, damit die Daten in die Datenbank aufgenommen werden können!</p>
        </BaseDialog>
    );
};

export default ErrorDialog;
