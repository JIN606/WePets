
import React from "react";
import type { FormField } from "../types";
import type { IFormTheme } from "../defaultTheme";

interface SelectFieldProps {
  fieldName: string;
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  theme: IFormTheme;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  fieldName,
  field,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  theme,
}) => {
  const options = field.enum || [];
  const optionLabels = field.enumNames || options;

  return (
    <div className={theme.field.container}>
      <label className={theme.field.label}>
        {field.title || fieldName}
        {required && <span className={theme.field.requiredIndicator}>*</span>}
      </label>
      {field.description && (
        <p className={theme.field.description}>{field.description}</p>
      )}

      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${theme.select.base} ${
            error ? theme.select.error : theme.select.normal
          } ${disabled ? theme.select.disabled : ""}`}
        >
          <option value="" disabled>
            Select...
          </option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {optionLabels[index] || option}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {error && <p className={theme.field.errorMessage}>{error}</p>}
    </div>
  );
};

