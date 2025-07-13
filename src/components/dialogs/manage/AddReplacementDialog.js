import React from 'react';
import BaseDialog from '../../BaseDialog';

const AddReplacementDialog = ({
    dialogRef,
    newReplacement,
    setNewReplacement,
    message,
    addReplacementID
}) => {
    const actions = [
        {
            label: 'Abbrechen',
            position: 'left',
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Hinzufügen',
            variant: 'success',
            onClick: addReplacementID
        }
    ];

    return (
        <BaseDialog
            dialogRef={dialogRef}
            title="Ersatz-ID hinzufügen"
            actions={actions}
            showDefaultClose={false}
        >
            <p>Geben Sie eine spezifische Ersatz-ID ein oder lassen Sie das Feld leer für eine automatische ID:</p>
            <input
                type="text"
                name="replacement"
                value={newReplacement}
                onChange={(e) => {
                    setNewReplacement(e.target.value);
                }}
            />
            {message && <p className="errorMessage">{message}</p>}
        </BaseDialog>
    );
};

export default AddReplacementDialog;
