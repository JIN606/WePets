import React from "react";
import type { FormField } from "../types";
import type { IFormTheme } from "../defaultTheme";

interface NumberFieldProps {
  fieldName: string;
  field: FormField;
  value: number | string;
  onChange: (value: number | string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  theme: IFormTheme;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  fieldName,
  field,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  theme,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onChange("");
    } else {
      const num = Number(val);
      onChange(isNaN(num) ? val : num);
    }
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
        type="number"
        id={fieldName}
        name={fieldName}
        value={value === undefined || value === null ? "" : value}
        onChange={handleChange}
        disabled={disabled}
        min={field.minimum}
        max={field.maximum}
        step={field.type === "integer" ? 1 : "any"}
        className={`${theme.input.base} ${
          error ? theme.input.error : theme.input.normal
        } ${disabled ? theme.input.disabled : ""}`}
        placeholder={`Enter ${field.title || fieldName}`}
      />
      {error && <p className={theme.field.errorMessage}>{error}</p>}
    </div>
  );
};
