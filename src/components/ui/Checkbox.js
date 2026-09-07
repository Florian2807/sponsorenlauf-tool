import React, { useId } from 'react';

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
  const generatedId = useId();
  const checkboxId = id || name || `checkbox-${generatedId}`;

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
