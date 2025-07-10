import React from 'react';
import BaseDialog from '../../BaseDialog';

const ConfirmDeleteTeacherDialog = ({
    dialogRef,
    deleteTeacher,
    editTeacherPopup
}) => {
    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Lehrer löschen',
            variant: 'danger',
            onClick: () => {
                deleteTeacher();
                dialogRef.current.close();
                editTeacherPopup.current.close();
            }
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Bestätigen Sie das Löschen"
            actions={actions}
            actionLayout="split"
            showDefaultClose={false}
        >
            <p>Möchten Sie diesen Lehrer wirklich löschen?</p>
        </BaseDialog>
    );
};

export default ConfirmDeleteTeacherDialog;
