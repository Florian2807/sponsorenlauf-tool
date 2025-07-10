import React from 'react';

const BaseDialog = ({
    dialogRef,
    title,
    children,
    onClose,
    className = '',
    size = 'medium',
    actions = null,
    showDefaultClose = true
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
            return (
                <div className="dialog-actions">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={`btn ${action.variant === 'danger' ? 'btn-danger' :
                                action.variant === 'secondary' ? 'btn-secondary' :
                                    action.variant === 'success' ? 'btn-success' : ''}`}
                            type={action.type || 'button'}
                            disabled={action.disabled}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            );
        }

        if (showDefaultClose) {
            return (
                <div className="dialog-actions">
                    <button className="btn" onClick={handleClose}>Schließen</button>
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
