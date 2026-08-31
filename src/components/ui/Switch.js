import React from 'react';

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
  const switchId = id || name || `switch-${Math.random().toString(36).substr(2, 9)}`;

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
