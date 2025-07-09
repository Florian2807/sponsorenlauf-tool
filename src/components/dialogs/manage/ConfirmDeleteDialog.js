import React from 'react';
import BaseDialog from '../../BaseDialog';

const ConfirmDeleteDialog = ({
    dialogRef,
    deleteStudent,
    editStudentPopup
}) => {
    const actions = [
        {
            label: 'Abbrechen',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Schüler löschen',
            variant: 'danger',
            onClick: () => {
                deleteStudent();
                dialogRef.current.close();
                editStudentPopup.current.close();
            }
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Bestätigen Sie das Löschen"
            actions={actions}
            showDefaultClose={false}
        >
            <p>Möchten Sie diesen Schüler wirklich löschen?</p>
        </BaseDialog>
    );
};

export default ConfirmDeleteDialog;
