import React from "react";

/**
 * Reusable labeled text input with inline validation message support.
 */
export default function Input({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  ...rest
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input-field ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
