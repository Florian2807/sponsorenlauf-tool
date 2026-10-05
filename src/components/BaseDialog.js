import React, { useCallback, useEffect, useId, useRef } from 'react';
import { usePanelPresentation, useWorkspaceEditor } from '../contexts/PanelNavigationContext';

const getEnabledActions = (actions, showDefaultClose, handleClose) => {
    if (actions?.length) {
        return actions.filter((action) => !action.disabled);
    }

    if (showDefaultClose) {
        return [
            {
                label: 'Schließen',
                variant: 'primary',
                onClick: handleClose,
                primary: true,
            },
        ];
    }

    return [];
};

const getCancelAction = (enabledActions) => {
    return enabledActions.find((action) => action.cancel)
        || enabledActions.find((action) => action.position === 'left')
        || enabledActions.find((action) => action.variant === 'secondary')
        || enabledActions.find((action) => /abbrechen|schließen|nein/i.test(action.label || ''))
        || null;
};

const getPrimaryAction = (enabledActions) => {
    return enabledActions.find((action) => action.primary)
        || enabledActions.find((action) => action.position !== 'left' && action.variant !== 'secondary')
        || (enabledActions.length > 1 ? enabledActions.at(-1) : null)
        || null;
};

const BaseDialog = ({
    dialogRef,
    title,
    children,
    onClose,
    onRequestClose,
    className = '',
    size = 'medium',
    actions = null,
    footer = null,
    showDefaultClose = true,
}) => {
    const titleId = useId();
    const lastFocusedElementRef = useRef(null);
    const { inline, closePanel, navigation } = usePanelPresentation(dialogRef);

    const cancelAction = getCancelAction(actions || []);
    const enabledActions = getEnabledActions(actions, showDefaultClose, closePanel);
    const primaryAction = getPrimaryAction(enabledActions);
    const busy = Boolean(cancelAction?.disabled);
    const active = navigation?.active !== false;
    const settingsAction = inline && navigation?.persistDrafts ? (actions || []).find(action => /^(Speichern|Speichere|Speichert)/.test(action.label || '')) : null;
    const hasSettingsAction = Boolean(settingsAction);
    useWorkspaceEditor({ id: settingsAction ? navigation.viewId : null, label: title, save: settingsAction?.onClick, disabled: Boolean(settingsAction?.disabled) });
    const handleClose = useCallback(() => {
        if (busy || dialogRef.current?.querySelector('[data-dialog-cancel-action="true"]:disabled')) return;
        if (onRequestClose) onRequestClose();
        else closePanel();
    }, [dialogRef, onRequestClose, busy, closePanel]);
    const callbacks = useRef({});
    callbacks.current = { onClose, handleClose, hasRequestClose: Boolean(onRequestClose), saveEditor: navigation?.saveEditor, editorId: navigation?.viewId };

    const onBusyChange = navigation?.onBusyChange;
    useEffect(() => {
        if (!inline || !active) return undefined;
        onBusyChange?.(busy);
        return () => onBusyChange?.(false);
    }, [inline, active, busy, onBusyChange]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return undefined;
        if (inline && !active) return undefined;
        let focusFrame;
        const focusable = () => Array.from(dialog.querySelectorAll(
            'button, input, select, textarea, a[href], summary, [tabindex]'
        )).filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
        const rememberFocus = (event) => {
            if (!inline && !dialog.open && event.target instanceof HTMLElement) lastFocusedElementRef.current = event.target;
        };
        const observer = new MutationObserver(() => {
            if (!dialog.open) return;
            focusFrame = requestAnimationFrame(() => {
                const fields = focusable().filter((element) => element.matches('input:not([readonly]), select, textarea'));
                const initial = fields.find((element) => element.autofocus)
                    || fields[0]
                    || dialog.querySelector('[data-dialog-primary-action="true"]:not(:disabled):not([data-dialog-danger-action])')
                    || dialog.querySelector('[data-dialog-cancel-action="true"]:not(:disabled)')
                    || dialog.querySelector('.dialog-close');
                initial?.focus();
            });
        });
        const cancel = (event) => {
            event.preventDefault();
            if (callbacks.current.hasRequestClose) { callbacks.current.handleClose(); return; }
            const action = dialog.querySelector('[data-dialog-cancel-action="true"]');
            if (action) { if (!action.disabled) action.click(); }
            else callbacks.current.handleClose();
        };
        const keydown = (event) => {
            if (event.defaultPrevented || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
            // Only the topmost dialog owns keyboard actions when dialogs are nested.
            if (inline ? event.target.closest('dialog') || event.target.closest('[data-inline-panel]') !== dialog : event.target.closest('dialog') !== dialog) return;
            if (event.key === 'Escape') {
                if (inline && navigation?.persistDrafts) return;
                if (inline) { event.preventDefault(); callbacks.current.handleClose(); }
                else cancel(event);
                return;
            }
            if (event.key === 'Tab') {
                if (inline) return;
                const elements = focusable();
                const first = elements[0];
                const last = elements.at(-1);
                if (!first) { event.preventDefault(); dialog.focus(); return; }
                if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                    event.preventDefault(); last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
                    event.preventDefault(); first.focus();
                }
                return;
            }
            if (event.key !== 'Enter') return;
            const target = event.target;
            // Preserve native activation, select menus, disclosures and multiline input.
            if (target.closest('button, a, summary, select, textarea, [contenteditable="true"], [role="combobox"][aria-expanded="true"]')
                || target.matches('input[type="checkbox"], input[type="radio"], input[type="file"]')) return;
            if (hasSettingsAction) {
                event.preventDefault();
                callbacks.current.saveEditor?.(callbacks.current.editorId);
                return;
            }
            const action = dialog.querySelector('[data-dialog-primary-action="true"]:not(:disabled)');
            event.preventDefault();
            if (!action || action.hasAttribute('data-dialog-danger-action')) return;
            const invalid = focusable().find((element) => element.matches('input, select, textarea') && !element.checkValidity());
            if (invalid) { invalid.reportValidity(); return; }
            action.click();
        };
        const closed = () => {
            callbacks.current.onClose?.();
            if (lastFocusedElementRef.current?.isConnected) lastFocusedElementRef.current.focus();
        };
        const pageEscape = (event) => {
            if (navigation?.persistDrafts || event.key !== 'Escape' || event.defaultPrevented || event.isComposing || document.querySelector('dialog[open]')) return;
            event.preventDefault();
            callbacks.current.handleClose();
        };
        if (inline) {
            dialog.querySelector('.dialog-title')?.focus();
            document.addEventListener('keydown', pageEscape);
        }
        else {
            document.addEventListener('focusin', rememberFocus);
            observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
            dialog.addEventListener('cancel', cancel);
            dialog.addEventListener('close', closed);
        }
        dialog.addEventListener('keydown', keydown);
        return () => {
            cancelAnimationFrame(focusFrame);
            observer.disconnect();
            document.removeEventListener('focusin', rememberFocus);
            document.removeEventListener('keydown', pageEscape);
            dialog.removeEventListener('cancel', cancel);
            dialog.removeEventListener('keydown', keydown);
            dialog.removeEventListener('close', closed);
        };
    }, [dialogRef, inline, active, hasSettingsAction, navigation?.persistDrafts]);

    const sizeClasses = {
        small: 'dialog-sm',
        medium: 'dialog-md',
        large: 'dialog-lg',
        xl: 'dialog-xl'
    };

    const renderAction = (action, key) => (
        <button
            key={key}
            onClick={action.onClick}
            data-dialog-cancel-action={cancelAction === action ? 'true' : undefined}
            data-dialog-primary-action={primaryAction === action ? 'true' : undefined}
            data-dialog-danger-action={action.variant === 'danger' ? 'true' : undefined}
            className={`btn ${action.variant === 'danger' ? 'btn-danger' :
                (action.variant === 'secondary' || cancelAction === action) ? 'btn-secondary' : 'btn-primary'}`}
            type={action.type || 'button'}
            disabled={action.disabled}
        >
            {action.label}
        </button>
    );

    const renderActions = () => {
        if (actions) {
            const visibleActions = inline && navigation?.persistDrafts ? actions.filter(action => !/^(Abbrechen|Schließen)$/.test(action.label || '')) : actions;
            if (!visibleActions.length) return null;
            const actionCount = visibleActions.length;

            // Determine action layout class based on count and layout preference
            let actionClass = 'dialog-actions';

            if (actionCount === 2) {
                // Special handling for split layout with exactly 2 actions
                actionClass += ' dialog-actions-split';
                const leftActions = visibleActions.some(action => action.position === 'left')
                    ? visibleActions.filter(action => action.position === 'left') : [visibleActions[0]];
                const rightActions = visibleActions.filter(action => !leftActions.includes(action));

                return (
                    <div className={actionClass}>
                        <div className="btn-group">
                            {leftActions.map((action, index) => renderAction(action, `left-${index}`))}
                        </div>
                        <div className="btn-group">
                            {rightActions.map((action, index) => renderAction(action, `right-${index}`))}
                        </div>
                    </div>
                );
            } else {
                // Auto-distribute actions based on count
                if (actionCount >= 2) {
                    actionClass += ` dialog-actions-distributed dialog-actions-count-${Math.min(actionCount, 5)}`;
                }

                return (
                    <div className={actionClass}>
                        {visibleActions.map((action, index) => renderAction(action, index))}
                    </div>
                );
            }
        }

        if (showDefaultClose) {
            return (
                <div className="dialog-actions">
                    <button className="btn btn-primary" onClick={handleClose} data-dialog-primary-action="true">Schließen</button>
                </div>
            );
        }

        return null;
    };

    const Shell = inline ? 'section' : 'dialog';
    return (
        <Shell
            ref={dialogRef}
            className={`dialog-shell ${className} ${sizeClasses[size]} ${inline ? 'setup-inline-panel' : ''}`}
            data-inline-panel={inline ? 'true' : undefined}
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
        >
            <div className="dialog-header">
                {title ? <h2 id={titleId} className="dialog-title" tabIndex={inline ? -1 : undefined}>{title}</h2> : <span />}
                {!navigation?.hideBack && <button
                    className="dialog-close"
                    onClick={handleClose}
                    type="button"
                    disabled={busy}
                    aria-label={inline ? 'Zur Übersicht' : 'Dialog schließen'}
                    title={inline ? 'Zur Übersicht' : 'Dialog schließen'}
                >
                    {inline ? <i className="fa-solid fa-arrow-left" aria-hidden="true" /> : '×'}
                </button>}
            </div>

            <div className="dialog-body card-body">
                {children}
            </div>

            {settingsAction ? <div className="dialog-actions settings-save-actions">
                <p role="status">{navigation.editorState[navigation.viewId]?.message || (navigation.editorState[navigation.viewId]?.dirty ? 'Ungespeicherte Änderungen' : 'Keine offenen Änderungen')}</p>
                <div className="btn-group">
                    <button type="button" className="btn btn-secondary" disabled={busy || !navigation.editorState[navigation.viewId]?.dirty} onClick={() => navigation.discardEditor(navigation.viewId)}>Änderungen verwerfen</button>
                    <button type="button" className="btn btn-primary" disabled={settingsAction.disabled || !navigation.editorState[navigation.viewId]?.dirty} onClick={() => navigation.saveEditor(navigation.viewId)}>{busy ? 'Speichert…' : 'Änderungen speichern'}</button>
                </div>
            </div> : footer || renderActions()}
        </Shell>
    );
};

export default BaseDialog;
