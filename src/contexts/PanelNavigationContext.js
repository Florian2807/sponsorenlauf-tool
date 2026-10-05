import { createContext, useCallback, useContext, useEffect, useRef } from 'react';

// Setup embeds the existing editors in its workspace. Other pages keep modal dialogs.
export const PanelNavigationContext = createContext(null);

export function usePanelPresentation(dialogRef) {
    const navigation = useContext(PanelNavigationContext);
    const onExit = navigation?.onExit;
    const closePanel = useCallback(() => {
        if (onExit) onExit();
        else dialogRef.current?.close();
    }, [dialogRef, onExit]);
    return { inline: Boolean(navigation), closePanel, navigation };
}

export function useWorkspaceEditor({ id, label, save, disabled = false, dirty }) {
    const navigation = useContext(PanelNavigationContext);
    const register = navigation?.registerEditor;
    const update = navigation?.updateEditor;
    const view = navigation?.viewId;
    const latest = useRef({ save, label });
    latest.current = { save, label };
    useEffect(() => {
        if (!register || !id) return undefined;
        return register(id, { save: () => latest.current.save(), label: latest.current.label, view });
    }, [register, id, view]);
    useEffect(() => {
        if (id) update?.(id, { label, disabled, ...(dirty !== undefined ? { dirty } : {}) });
    }, [update, id, label, disabled, dirty]);
    return Boolean(register && id);
}
