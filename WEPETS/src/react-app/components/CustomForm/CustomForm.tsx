import React, { useState, useMemo } from "react";
import type { FormSchema, FormData, FormErrors, FormProps } from "./types";
import { FormValidator } from "./validation";
import { FieldRenderer } from "./FieldRenderer";
import { mergeTheme } from "./defaultTheme";

function getDefaultFormData(schema: FormSchema, initialFormData: FormData) {
  const defaultData: FormData = {};
  Object.keys(schema.properties).forEach((key) => {
    const field = schema.properties[key];
    defaultData[key] = initialFormData[key] ?? field.default ?? "";
  });

  return defaultData;
}

/**
 * CustomForm component
 *
 * @param id - The id of the form
 * @param schema - The JSON schema for the form
 * @param formData - The initial form data
 * @param onChange - The function to call when the form data changes
 * @param onSubmit - The function to call when the form is submitted
 * @param className - The className for the form
 * @param theme - The theme for the form
 */
export const CustomForm: React.FC<FormProps> = ({
  id,
  schema,
  formData: initialFormData = {},
  onChange,
  onSubmit,
  className = "",
  theme,
}) => {
  const formTheme = useMemo(() => mergeTheme(theme), [theme]);
  const filteredProperties = useMemo(() => {
    return Object.fromEntries(
      Object.entries(schema.properties).filter(
        ([_, field]: any) => !field.readOnly
      )
    );
  }, [schema.properties]);

  const filteredSchema = useMemo(
    () => ({
      ...schema,
      properties: filteredProperties,
    }),
    [schema, filteredProperties]
  );

  const [formData, setFormData] = useState<FormData>(
    getDefaultFormData(filteredSchema, initialFormData)
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = {
      ...formData,
      [fieldName]: value,
    };

    setFormData(newFormData);

    // 实时校验单个字段
    const field = filteredProperties[fieldName];
    const error = FormValidator.validateField(
      value,
      field,
      fieldName,
      filteredSchema
    );
    const newErrors = { ...errors };

    if (error) {
      newErrors[fieldName] = error;
    } else {
      delete newErrors[fieldName];
    }

    setErrors(newErrors);

    // 触发外部onChange回调
    if (onChange) {
      onChange(newFormData, newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 提交时进行完整校验
    const allErrors = FormValidator.validateForm(filteredSchema, formData);
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
        fetch("/api/webhooks/form-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData }),
        });
      }
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const defaultData: FormData = {};
    Object.keys(filteredProperties).forEach((key) => {
      const field = filteredProperties[key];
      defaultData[key] = field.default ?? "";
    });
    setFormData(defaultData);
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`${formTheme.form.container} ${className}`}
      data-schema-id={id}
    >
      {schema.title && (
        <div className={formTheme.form.titleSection}>
          <h2 className={formTheme.form.title}>{schema.title}</h2>
          {schema.description && (
            <p className={formTheme.form.description}>{schema.description}</p>
          )}
        </div>
      )}

      <div className={formTheme.form.fieldsContainer}>
        {Object.keys(filteredProperties).map((fieldName) => {
          const field = filteredProperties[fieldName];
          const isRequired =
            filteredSchema.required?.includes(fieldName) ?? false;

          return (
            <FieldRenderer
              key={fieldName}
              fieldName={fieldName}
              field={field}
              value={formData[fieldName]}
              onChange={(value) => handleFieldChange(fieldName, value)}
              error={errors[fieldName]}
              disabled={isSubmitting}
              required={isRequired}
              theme={formTheme}
            />
          );
        })}
      </div>

      <div className={formTheme.form.buttonSection}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${formTheme.buttons.submit.base} ${formTheme.buttons.submit.disabled}`}
        >
          {isSubmitting ? "submitting..." : "submit"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className={`${formTheme.buttons.reset.base} ${formTheme.buttons.reset.disabled}`}
        >
          reset
        </button>
      </div>
    </form>
  );
};
