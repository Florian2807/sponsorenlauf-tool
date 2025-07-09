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
            onClick: () => dialogRef.current.close()
        },
        {
            label: 'Hinzufügen',
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
            <p>Füge eine Ersatz-ID zum Schüler hinzu</p>
            <input
                type="number"
                name="replacement"
                value={newReplacement}
                onChange={(e) => setNewReplacement(e.target.value)}
                required
            />
            {message && <p className="errorMessage">{message}</p>}
        </BaseDialog>
    );
};

export default AddReplacementDialog;
