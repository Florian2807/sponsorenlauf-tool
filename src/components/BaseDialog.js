import React from 'react';

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
    const handleClose = () => {
        if (onClose) {
            onClose();
        }
        dialogRef.current?.close();
    };

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
                    <button className="btn btn-primary" onClick={handleClose}>Schließen</button>
                </div>
            );
        }

        return null;
    };

    return (
        <dialog
            ref={dialogRef}
            className={`${className} ${sizeClasses[size]}`}
        >
            <button
                className="dialog-close"
                onClick={handleClose}
                type="button"
                title="Dialog schließen"
            >
                &times;
            </button>

            {title && <h2 className="page-title">{title}</h2>}

            <div className="card-body">
                {children}
            </div>

            {renderActions()}
        </dialog>
    );
};

export default BaseDialog;
