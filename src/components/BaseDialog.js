import React, { useCallback, useEffect, useId, useRef } from 'react';

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
        || enabledActions.at(-1)
        || null;
};

const BaseDialog = ({
    dialogRef,
    title,
    children,
    onClose,
    className = '',
    size = 'medium',
    actions = null,
    showDefaultClose = true,
}) => {
    const titleId = useId();
    const lastFocusedElementRef = useRef(null);

    const handleClose = useCallback(() => {
        dialogRef.current?.close();
    }, [dialogRef]);

    const enabledActions = getEnabledActions(actions, showDefaultClose, handleClose);
    const cancelAction = getCancelAction(enabledActions);
    const primaryAction = getPrimaryAction(enabledActions);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return undefined;
        }

        const rememberLastFocusedElement = () => {
            if (!dialog.open && document.activeElement instanceof HTMLElement) {
                lastFocusedElementRef.current = document.activeElement;
            }
        };

        const triggerDialogAction = (selector, fallback) => {
            const actionButton = dialog.querySelector(selector);

            if (actionButton instanceof HTMLButtonElement) {
                actionButton.click();
                return true;
            }

            fallback?.();
            return false;
        };

        const focusPrimaryAction = () => {
            requestAnimationFrame(() => {
                const preferredActionButton = dialog.querySelector('[data-dialog-primary-action="true"]');
                preferredActionButton?.focus();
            });
        };

        const observer = new MutationObserver(() => {
            if (dialog.open) {
                focusPrimaryAction();
            }
        });

        const handleCancel = (event) => {
            event.preventDefault();
            triggerDialogAction('[data-dialog-cancel-action="true"]', () => dialog.close());
        };

        const handleKeyDown = (event) => {
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            const targetTagName = event.target?.tagName;

            if (event.key === 'Escape') {
                event.preventDefault();
                triggerDialogAction('[data-dialog-cancel-action="true"]', () => dialog.close());
                return;
            }

            if (event.key !== 'Enter') {
                return;
            }

            if (targetTagName === 'TEXTAREA' || targetTagName === 'BUTTON') {
                return;
            }

            event.preventDefault();
            triggerDialogAction('[data-dialog-primary-action="true"]');
        };

        const handleCloseEvent = () => {
            onClose?.();
            lastFocusedElementRef.current?.focus?.();
        };

        document.addEventListener('focusin', rememberLastFocusedElement);
        observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
        dialog.addEventListener('cancel', handleCancel);
        dialog.addEventListener('keydown', handleKeyDown);
        dialog.addEventListener('close', handleCloseEvent);

        return () => {
            document.removeEventListener('focusin', rememberLastFocusedElement);
            observer.disconnect();
            dialog.removeEventListener('cancel', handleCancel);
            dialog.removeEventListener('keydown', handleKeyDown);
            dialog.removeEventListener('close', handleCloseEvent);
        };
    }, [dialogRef, onClose]);

    const sizeClasses = {
        small: 'dialog-sm',
        medium: 'dialog-md',
        large: 'dialog-lg',
        xl: 'dialog-xl'
    };

    const renderActions = () => {
        if (actions) {
            const actionCount = actions.length;

            // Determine action layout class based on count and layout preference
            let actionClass = 'dialog-actions';

            if (actionCount === 2) {
                // Special handling for split layout with exactly 2 actions
                actionClass += ' dialog-actions-split';
                const leftActions = actions.filter(action => action.position === 'left');
                const rightActions = actions.filter(action => action.position !== 'left');

                // If no position specified, put first action left, second right
                if (leftActions.length === 0 && rightActions.length === 0) {
                    leftActions.push(actions[0]);
                    rightActions.push(actions[1]);
                } else if (leftActions.length === 0) {
                    leftActions.push(actions[0]);
                } else if (rightActions.length === 0) {
                    rightActions.push(actions[1]);
                }

                return (
                    <div className={actionClass}>
                        <div className="btn-group">
                            {leftActions.map((action, index) => (
                                <button
                                    key={`left-${index}`}
                                    onClick={action.onClick}
                                    data-dialog-cancel-action={cancelAction === action ? 'true' : undefined}
                                    data-dialog-primary-action={primaryAction === action ? 'true' : undefined}
                                    className={`btn ${action.variant === 'danger' ? 'btn-danger' :
                                        action.variant === 'secondary' ? 'btn-secondary' :
                                            action.variant === 'success' ? 'btn-success' : 'btn-primary'}`}
                                    type={action.type || 'button'}
                                    disabled={action.disabled}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                        <div className="btn-group">
                            {rightActions.map((action, index) => (
                                <button
                                    key={`right-${index}`}
                                    onClick={action.onClick}
                                    data-dialog-cancel-action={cancelAction === action ? 'true' : undefined}
                                    data-dialog-primary-action={primaryAction === action ? 'true' : undefined}
                                    className={`btn ${action.variant === 'danger' ? 'btn-danger' :
                                        action.variant === 'secondary' ? 'btn-secondary' :
                                            action.variant === 'success' ? 'btn-success' : 'btn-primary'}`}
                                    type={action.type || 'button'}
                                    disabled={action.disabled}
                                >
                                    {action.label}
                                </button>
                            ))}
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
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                data-dialog-cancel-action={cancelAction === action ? 'true' : undefined}
                                data-dialog-primary-action={primaryAction === action ? 'true' : undefined}
                                className={`btn ${action.variant === 'danger' ? 'btn-danger' :
                                    action.variant === 'secondary' ? 'btn-secondary' :
                                        action.variant === 'success' ? 'btn-success' : 'btn-primary'}`}
                                type={action.type || 'button'}
                                disabled={action.disabled}
                            >
                                {action.label}
                            </button>
                        ))}
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

    return (
        <dialog
            ref={dialogRef}
            className={`dialog-shell ${className} ${sizeClasses[size]}`}
            aria-labelledby={title ? titleId : undefined}
        >
            <div className="dialog-header">
                {title ? <h2 id={titleId} className="dialog-title">{title}</h2> : <span />}
                <button
                    className="dialog-close"
                    onClick={handleClose}
                    type="button"
                    aria-label="Dialog schließen"
                    title="Dialog schließen"
                >
                    &times;
                </button>
            </div>

            <div className="dialog-body card-body">
                {children}
            </div>

            {renderActions()}
        </dialog>
    );
};

export default BaseDialog;
