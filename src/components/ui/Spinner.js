import React from 'react';

/**
 * Loading Spinner Component
 * 
 * @example
 * <Spinner size="lg" />
 * <Spinner text="Loading..." />
 */
export default function Spinner({
  size = 'md',
  text = '',
  className = '',
  ...props
}) {
  const getSizeClass = () => {
    const sizes = {
      sm: 'spinner-sm',
      md: '',
      lg: 'spinner-lg',
    };
    return sizes[size] || '';
  };

  const classes = [
    'spinner',
    getSizeClass(),
    className,
  ].filter(Boolean).join(' ');

  if (text) {
    return (
      <div className="loading-container" {...props}>
        <span className={classes} aria-hidden="true" />
        <span className="loading-text">{text}</span>
      </div>
    );
  }

  return <span className={classes} role="status" aria-label="Loading" {...props} />;
}
