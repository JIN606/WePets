import type { FormField, FormData, FormErrors, FormSchema } from "./types";

export class FormValidator {
  static isEmptyValue(value: any): boolean {
    return (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "string" && value.trim() === "")
    );
  }

  /**
   * Validate a single field
   *
   * @param value - The value to validate
   * @param field - The field to validate
   * @param fieldName - The name of the field
   * @param schema - The schema of the form
   * @returns The error message if the field is invalid, otherwise null
   */
  static validateField(
    value: any,
    field: FormField,
    fieldName: string,
    schema: FormSchema
  ): string | null {
    const isRequired = schema.required?.includes(fieldName) ?? false;

    // Required field validation - using stricter empty value check
    if (isRequired) {
      // For boolean type, false is a valid value
      if (field.type === "boolean" && value === false) {
        // Allow false value
      } else if (this.isEmptyValue(value)) {
        return `${field.title || fieldName} is required`;
      }
    }

    // If value is empty and not required, skip other validations
    if (this.isEmptyValue(value)) {
      return null;
    }

    // Type validation
    switch (field.type) {
      case "boolean":
        if (typeof value !== "boolean") {
          return `${field.title || fieldName} must be a boolean`;
        }
        break;

      case "number":
      case "integer":
        if (isNaN(Number(value))) {
          return `${field.title || fieldName} must be a number`;
        }
        if (field.type === "integer" && !Number.isInteger(Number(value))) {
          return `${field.title || fieldName} must be an integer`;
        }
        if (field.minimum !== undefined && Number(value) < field.minimum) {
          return `${field.title || fieldName} cannot be less than ${
            field.minimum
          }`;
        }
        if (field.maximum !== undefined && Number(value) > field.maximum) {
          return `${field.title || fieldName} cannot be greater than ${
            field.maximum
          }`;
        }
        break;

      case "string":
        if (typeof value !== "string") {
          return `${field.title || fieldName} must be a string`;
        }

        // Format-specific validation
        switch (field.format) {
          case "email":
            const emailRegex =
              /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(value)) {
              return `${field.title || fieldName} is not a valid email`;
            }
            break;

          case "date":
          case "date-time":
            if (isNaN(Date.parse(value))) {
              return `${field.title || fieldName} must be a valid date`;
            }
            break;

          default:
            // Regular string validation
            if (
              field.minLength !== undefined &&
              value.length < field.minLength
            ) {
              return `${field.title || fieldName} must be at least ${
                field.minLength
              } characters`;
            }
            if (
              field.maxLength !== undefined &&
              value.length > field.maxLength
            ) {
              return `${field.title || fieldName} cannot exceed ${
                field.maxLength
              } characters`;
            }
            break;
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          return `${field.title || fieldName} must be an array`;
        }
        if (field.enum && value.some((v) => !field.enum?.includes(v))) {
          return `${field.title || fieldName} contains invalid options`;
        }
        break;
    }

    // Pattern validation
    if (field.pattern && typeof value === "string") {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        return `${field.title || fieldName} is not valid`;
      }
    }

    // Enum validation (for select fields)
    if (field.enum && field.type === "string") {
      if (!field.enum.includes(value)) {
        return `${field.title || fieldName} must be one of the valid options`;
      }
    }

    return null;
  }

  static validateForm(schema: FormSchema, formData: FormData): FormErrors {
    const errors: FormErrors = {};

    if (!schema.properties) return errors;

    Object.keys(schema.properties).forEach((fieldName) => {
      const field = schema.properties[fieldName];
      const value = formData[fieldName];
      const error = this.validateField(value, field, fieldName, schema);

      if (error) {
        errors[fieldName] = error;
      }
    });

    return errors;
  }

  static isValid(errors: FormErrors): boolean {
    return Object.keys(errors).length === 0;
  }
}
