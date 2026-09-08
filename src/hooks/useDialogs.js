import { useCallback, useRef } from 'react';

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
    const openDialog = useCallback((name) => {
        const ref = refs[`${name}Ref`];
        if (ref?.current) {
            ref.current.showModal();
        }
    }, [refs]);

    const closeDialog = useCallback((name) => {
        const ref = refs[`${name}Ref`];
        if (ref?.current) {
            ref.current.close();
        }
    }, [refs]);

    const isDialogOpen = useCallback((name) => {
        const ref = refs[`${name}Ref`];
        return ref?.current?.open || false;
    }, [refs]);

    return {
        refs,
        openDialog,
        closeDialog,
        isDialogOpen
    };
};
