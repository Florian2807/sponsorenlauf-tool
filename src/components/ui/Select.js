import React, { useId } from 'react';

/**
 * Select/Dropdown Component
 * 
 * @example
 * <Select 
 *   label="Choose option"
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' }
 *   ]}
 *   value={value}
 *   onChange={handleChange}
 * />
 */
export default function Select({
  label,
  options = [],
  id,
  name,
  value,
  onChange,
  error,
  hint,
  disabled = false,
  required = false,
  placeholder = 'Select an option...',
  className = '',
  ...props
}) {
  const generatedId = useId();
  const selectId = id || name || `select-${generatedId}`;

  const selectClasses = [
    'form-select',
    error ? 'error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {hint && !error && (
        <span id={`${selectId}-hint`} className="form-hint">
          {hint}
        </span>
      )}

      {error && (
        <span id={`${selectId}-error`} className="form-hint text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
