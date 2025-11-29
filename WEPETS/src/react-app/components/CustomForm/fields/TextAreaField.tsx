import React from "react";
import type { FormField } from "../types";
import type { IFormTheme } from "../defaultTheme";

interface TextAreaFieldProps {
  fieldName: string;
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  theme: IFormTheme;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  fieldName,
  field,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  theme,
}) => {
  // Extract rows and cols from field properties if available
  const rows = (field as any).rows || 4;
  const cols = (field as any).cols;

  return (
    <div className={theme.field.container}>
      <label htmlFor={fieldName} className={theme.field.label}>
        {field.title || fieldName}
        {required && <span className={theme.field.requiredIndicator}>*</span>}
      </label>
      {field.description && (
        <p className={theme.field.description}>{field.description}</p>
      )}
      <textarea
        id={fieldName}
        name={fieldName}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        cols={cols}
        className={`${theme.textarea.base} ${
          error ? theme.textarea.error : theme.textarea.normal
        } ${disabled ? theme.textarea.disabled : ""}`}
        placeholder={`Enter ${field.title || fieldName}`}
        minLength={field.minLength}
        maxLength={field.maxLength}
      />
      {error && <p className={theme.field.errorMessage}>{error}</p>}
    </div>
  );
};
