import React from 'react';
import '../styles/BaseDialog.module.css';

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
        small: 'max-w-md',
        medium: 'max-w-lg',
        large: 'max-w-2xl'
    };

    const renderActions = () => {
        if (actions) {
            return (
                <div className="popupButtons">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={action.variant === 'danger' ? 'redButton' : ''}
                            type={action.type || 'button'}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            );
        }

        if (showDefaultClose) {
            return (
                <div className="popupButtons">
                    <button onClick={handleClose}>Schließen</button>
                </div>
            );
        }

        return null;
    };

    return (
        <dialog
            ref={dialogRef}
            className={`popup ${className} ${sizeClasses[size]}`}
        >
            <button
                className="closeButtonX"
                onClick={handleClose}
                type="button"
            >
                &times;
            </button>

            {title && <h2>{title}</h2>}

            {children}

            {renderActions()}
        </dialog>
    );
};

export default BaseDialog;
