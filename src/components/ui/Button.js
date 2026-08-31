import React from 'react';

/**
 * Modern Button Component
 * 
 * Variants: primary (default), secondary, success, danger, warning, ghost, outline
 * Sizes: sm, md (default), lg, xl
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const getVariantClass = () => {
    const variants = {
      primary: '',
      secondary: 'btn-secondary',
      success: 'btn-success',
      danger: 'btn-danger',
      warning: 'btn-warning',
      ghost: 'btn-ghost',
      outline: 'btn-outline',
    };
    return variants[variant] || '';
  };

  const getSizeClass = () => {
    const sizes = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
      xl: 'btn-xl',
    };
    return sizes[size] || '';
  };

  const classes = [
    'btn',
    getVariantClass(),
    getSizeClass(),
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <span className="spinner spinner-sm" aria-hidden="true" />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
