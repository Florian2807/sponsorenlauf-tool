import React, { useId } from 'react';

/**
 * Switch/Toggle Component
 * 
 * @example
 * <Switch 
 *   label="Enable notifications" 
 *   checked={enabled}
 *   onChange={handleToggle}
 * />
 */
export default function Switch({
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
  const switchId = id || name || `switch-${generatedId}`;

  return (
    <label className={`switch-wrapper ${className}`} htmlFor={switchId}>
      {label && <span className="switch-label">{label}</span>}
      <div className="switch">
        <input
          type="checkbox"
          id={switchId}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        <span className="toggle-slider" />
      </div>
    </label>
  );
}
