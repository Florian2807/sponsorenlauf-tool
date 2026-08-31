import React from 'react';

/**
 * Modern Card Component
 * 
 * @example
 * <Card>
 *   <CardHeader title="Title" />
 *   <CardBody>Content here</CardBody>
 *   <CardFooter>Footer content</CardFooter>
 * </Card>
 */
export function Card({ children, className = '', hover = false, ...props }) {
  const classes = [
    'card',
    hover ? 'hover-lift' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, children, actions, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      <div>
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  );
}

export default Card;
