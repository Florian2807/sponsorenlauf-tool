import { useEffect, useRef, useState } from 'react';

// Native modal dialogs live in the browser's top layer, above every z-index.
export default function useNotificationPopover(active) {
    const ref = useRef(null);
    const [dialog, setDialog] = useState(null);

    useEffect(() => {
        if (!active) return undefined;
        const updateDialog = () => setDialog(Array.from(document.querySelectorAll('dialog[open]')).at(-1) || null);
        updateDialog();
        const observer = new MutationObserver((mutations) => {
            if (mutations.some(({ target, attributeName }) => target instanceof HTMLDialogElement && attributeName === 'open')) updateDialog();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
        return () => observer.disconnect();
    }, [active]);

    useEffect(() => {
        const element = ref.current;
        if (!element?.showPopover) return undefined;

        const raise = () => {
            if (element.matches(':popover-open')) element.hidePopover();
            element.showPopover();
        };
        raise();

        return () => {
            if (element.matches(':popover-open')) element.hidePopover();
        };
    }, [active, dialog]);

    return [ref, dialog];
}
