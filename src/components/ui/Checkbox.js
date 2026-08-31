import React from 'react';

/**
 * Checkbox Component
 * 
 * @example
 * <Checkbox 
 *   label="Accept terms" 
 *   checked={checked}
 *   onChange={handleChange}
 * />
 */
export default function Checkbox({
  label,
  id,
  name,
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}) {
  const checkboxId = id || name || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label className={`checkbox-wrapper ${className}`} htmlFor={checkboxId}>
      <input
        type="checkbox"
        id={checkboxId}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <span className="checkbox-icon" aria-hidden="true" />
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  );
}
