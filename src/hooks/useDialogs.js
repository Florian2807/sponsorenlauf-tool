import { useRef, useMemo } from 'react';

/**
 * Custom Hook für Dialog-Referenzen Management
 * Reduziert Boilerplate-Code für mehrere Dialog-Refs
 */
export const useDialogs = (dialogNames) => {
    // Erstelle Refs für alle angegebenen Dialog-Namen
    const refs = useMemo(() => {
        const refsObj = {};
        dialogNames.forEach(name => {
            refsObj[`${name}Ref`] = { current: null };
        });
        return refsObj;
    }, [dialogNames]);

    // Helper-Funktionen für häufige Dialog-Operationen
    const openDialog = (name) => {
        const ref = refs[`${name}Ref`];
        if (ref?.current) {
            ref.current.showModal();
        }
    };

    const closeDialog = (name) => {
        const ref = refs[`${name}Ref`];
        if (ref?.current) {
            ref.current.close();
        }
    };

    const isDialogOpen = (name) => {
        const ref = refs[`${name}Ref`];
        return ref?.current?.open || false;
    };

    return {
        refs,
        openDialog,
        closeDialog,
        isDialogOpen
    };
};
