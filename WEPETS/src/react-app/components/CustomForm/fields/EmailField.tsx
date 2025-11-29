import React from "react";
import type { FormField } from "../types";
import type { IFormTheme } from "../defaultTheme";

interface EmailFieldProps {
  fieldName: string;
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  theme: IFormTheme;
}

export const EmailField: React.FC<EmailFieldProps> = ({
  fieldName,
  field,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  theme,
}) => {
  return (
    <div className={theme.field.container}>
      <label htmlFor={fieldName} className={theme.field.label}>
        {field.title || fieldName}
        {required && <span className={theme.field.requiredIndicator}>*</span>}
      </label>
      {field.description && (
        <p className={theme.field.description}>{field.description}</p>
      )}
      <input
        type="email"
        id={fieldName}
        name={fieldName}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${theme.input.base} ${
          error ? theme.input.error : theme.input.normal
        } ${disabled ? theme.input.disabled : ""}`}
        placeholder="Enter email address"
      />
      {error && <p className={theme.field.errorMessage}>{error}</p>}
    </div>
  );
};
