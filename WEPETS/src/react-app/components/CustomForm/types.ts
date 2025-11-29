export interface FormField {
    type: "string" | "number" | "integer" | "boolean" | "array" | "object";
    title?: string;
    description?: string;
    default?: any;
    enum?: any[];
    enumNames?: string[];
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    format?:
      | "email"
      | "date"
      | "date-time"
      | "time"
      | "uri"
      | "hostname"
      | "ipv4"
      | "ipv6"
      | "uuid"
      | string;
    pattern?: string;
    items?: FormField; // 用于数组类型（多选checkbox）
    uniqueItems?: boolean; // 数组元素是否唯一
    minItems?: number; // 最少选择数量
    maxItems?: number; // 最多选择数量
  }
  
  export interface FormSchema {
    type: "object";
    title?: string;
    description?: string;
    properties: Record<string, FormField>;
    required?: string[]; // 标准JSON Schema格式：必填字段名称数组
  }
  
  export interface FormData {
    [key: string]: any;
  }
  
  export interface FormErrors {
    [key: string]: string;
  }
  
  export interface ValidationRule {
    validator: (value: any, field: FormField, isRequired: boolean) => boolean;
    message: string;
  }
  
  import type { IFormTheme } from "./defaultTheme";
  
  export interface FormProps {
    id: string;
    schema: FormSchema;
    formData?: FormData;
    onChange?: (data: FormData, errors: FormErrors) => void;
    onSubmit: (data: FormData) => void;
    className?: string;
    theme?: Partial<IFormTheme>;
  }
  