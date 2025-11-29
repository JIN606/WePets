import React from "react";
import type { FormField } from "./types";
import type { IFormTheme } from "./defaultTheme";
import { TextField } from "./fields/TextField";
import { TextAreaField } from "./fields/TextAreaField";
import { EmailField } from "./fields/EmailField";
import { NumberField } from "./fields/NumberField";
import { DateField } from "./fields/DateField";
import { BooleanField } from "./fields/BooleanField";
import { CheckboxField } from "./fields/CheckboxField";
import { SelectField } from "./fields/SelectField";

interface FieldRendererProps {
  fieldName: string;
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  theme: IFormTheme;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  fieldName,
  field,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  theme,
}) => {
  const commonProps = {
    fieldName,
    field,
    value,
    onChange,
    error,
    disabled,
    required,
    theme,
  };

  // 标准JSON Schema判断逻辑
  switch (field.type) {
    case "boolean":
      return <BooleanField {...commonProps} />;

    case "array":
      // 数组类型用于多选checkbox
      return <CheckboxField {...commonProps} />;

    case "string":
      // 根据format字段判断具体类型
      switch (field.format) {
        case "email":
          return <EmailField {...commonProps} />;
        case "date":
        case "date-time":
          return <DateField {...commonProps} />;
        case "textarea":
          return <TextAreaField {...commonProps} />;
        default:
          // Check for multiline property (alternative way to specify textarea)
          if ((field as any).multiline === true) {
            return <TextAreaField {...commonProps} />;
          }
          // 所有有enum的字符串类型都使用下拉框
          if (field.enum && field.enum.length > 0) {
            return <SelectField {...commonProps} />;
          }
          return <TextField {...commonProps} />;
      }

    case "number":
    case "integer":
      return <NumberField {...commonProps} />;

    default:
      return (
        <div className={theme.unsupportedField.container}>
          <p className={theme.unsupportedField.message}>
            unsupported field type: {field.type}
          </p>
        </div>
      );
  }
};
