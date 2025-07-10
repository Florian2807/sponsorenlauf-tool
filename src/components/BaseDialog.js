import React from 'react';
import styles from '../styles/BaseDialog.module.css';

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
        small: styles.maxWMd,
        medium: styles.maxWLg,
        large: styles.maxW2xl
    };

    const renderActions = () => {
        if (actions) {
            return (
                <div className={styles.popupButtons}>
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={action.variant === 'danger' ? styles.redButton : ''}
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
                <div className={styles.popupButtons}>
                    <button onClick={handleClose}>Schließen</button>
                </div>
            );
        }

        return null;
    };

    return (
        <dialog
            ref={dialogRef}
            className={`${styles.popup} ${className} ${sizeClasses[size]}`}
        >
            <button
                className={styles.closeButtonX}
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
