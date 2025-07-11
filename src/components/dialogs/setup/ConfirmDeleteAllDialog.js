import React from 'react';
import BaseDialog from '../../BaseDialog';

const ConfirmDeleteAllDialog = ({
    dialogRef,
    handleDeleteAllStudents
}) => {
    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Alle löschen',
            variant: 'danger',
            onClick: handleDeleteAllStudents
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Bestätigen Sie das Löschen"
            actions={actions}
            showDefaultClose={false}
        >
            <p>Möchten Sie wirklich alle Schüler löschen?</p>
        </BaseDialog>
    );
};

export default ConfirmDeleteAllDialog;
