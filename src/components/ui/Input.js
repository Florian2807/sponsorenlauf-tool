import React, { useId } from 'react';

/**
 * Modern Input Component
 * 
 * @example
 * <Input 
 *   label="Email" 
 *   type="email" 
 *   placeholder="name@example.com"
 *   error="Invalid email"
 * />
 */
export default function Input({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  success,
  hint,
  disabled = false,
  required = false,
  className = '',
  icon = null,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || name || `input-${generatedId}`;

  const getStateClass = () => {
    if (error) return 'error';
    if (success) return 'success';
    return '';
  };

  const inputClasses = [
    'form-control',
    getStateClass(),
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {icon && <span className="input-icon">{icon}</span>}
        {success && !error && (
          <span className="success-indicator" aria-hidden="true">✓</span>
        )}
      </div>

      {hint && !error && (
        <span id={`${inputId}-hint`} className="form-hint">
          {hint}
        </span>
      )}

      {error && (
        <span id={`${inputId}-error`} className="form-hint text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
