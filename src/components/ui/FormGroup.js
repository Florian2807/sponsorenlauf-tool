import React from 'react';

/**
 * FormGroup Component - Groups Label + Input/Select/etc
 * 
 * @example
 * <FormGroup label="Email" hint="We'll never share your email">
 *   <input type="email" className="form-control" />
 * </FormGroup>
 */
export default function FormGroup({
  label,
  children,
  hint,
  error,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`} {...props}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <span className="form-hint">{hint}</span>
      )}
      {error && (
        <span className="form-hint text-danger">{error}</span>
      )}
    </div>
  );
}
