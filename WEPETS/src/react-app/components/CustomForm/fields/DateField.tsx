import React from "react";
import type { FormField } from "../types";
import type { IFormTheme } from "../defaultTheme";

interface DateFieldProps {
  fieldName: string;
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  theme: IFormTheme;
}

export const DateField: React.FC<DateFieldProps> = ({
  fieldName,
  field,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  theme,
}) => {
  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

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
        type="date"
        id={fieldName}
        name={fieldName}
        value={value ? formatDate(value) : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${theme.dateInput.base} ${
          error ? theme.dateInput.error : theme.dateInput.normal
        } ${disabled ? theme.dateInput.disabled : ""}`}
      />
      {error && <p className={theme.field.errorMessage}>{error}</p>}
    </div>
  );
};
