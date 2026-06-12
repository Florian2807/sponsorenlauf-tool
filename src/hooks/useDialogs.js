import { useRef } from 'react';

/**
 * Custom Hook für Dialog-Referenzen Management
 * Reduziert Boilerplate-Code für mehrere Dialog-Refs
 */
export const useDialogs = (dialogNames) => {
    const refsStore = useRef({});

    dialogNames.forEach((name) => {
        const refName = `${name}Ref`;
        if (!refsStore.current[refName]) {
            refsStore.current[refName] = { current: null };
        }
    });

    const refs = refsStore.current;

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
