import React from 'react';

/**
 * Alert/Message Component
 * 
 * @example
 * <Alert variant="success">Operation successful!</Alert>
 * <Alert variant="error" dismissible onDismiss={handleDismiss}>
 *   An error occurred.
 * </Alert>
 */
export default function Alert({
  children,
  variant = 'info',
  dismissible = false,
  onDismiss,
  icon = null,
  className = '',
  ...props
}) {
  const getVariantClass = () => {
    const variants = {
      success: 'message-success',
      error: 'message-error',
      warning: 'message-warning',
      info: 'message-info',
    };
    return variants[variant] || 'message-info';
  };

  const getDefaultIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[variant] || 'ℹ';
  };

  const classes = [
    'message',
    getVariantClass(),
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert" {...props}>
      <span className="alert-icon" aria-hidden="true">
        {icon || getDefaultIcon()}
      </span>
      <div className="alert-content">{children}</div>
      {dismissible && (
        <button
          type="button"
          className="alert-close"
          onClick={onDismiss}
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
