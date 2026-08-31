import React from 'react';

/**
 * Badge/Tag Component
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">Error</Badge>
 */
export default function Badge({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  const getVariantClass = () => {
    const variants = {
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      success: 'badge-success',
      danger: 'badge-danger',
      warning: 'badge-warning',
      info: 'badge-info',
      muted: 'badge-muted',
    };
    return variants[variant] || 'badge-primary';
  };

  const classes = [
    'badge',
    getVariantClass(),
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
