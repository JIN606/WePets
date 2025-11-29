import { cn } from "../../utils";

export interface IFormTheme {
  // Form container styles
  form: {
    container: string;
    titleSection: string;
    title: string;
    description: string;
    fieldsContainer: string;
    buttonSection: string;
  };

  // Submit and reset button styles
  buttons: {
    submit: {
      base: string;
      disabled: string;
    };
    reset: {
      base: string;
      disabled: string;
    };
  };

  // Common field styles
  field: {
    container: string;
    label: string;
    requiredIndicator: string;
    description: string;
    errorMessage: string;
  };

  // Text/Email/Number input styles
  input: {
    base: string;
    normal: string;
    error: string;
    disabled: string;
    placeholder?: string;
  };

  // Textarea styles
  textarea: {
    base: string;
    normal: string;
    error: string;
    disabled: string;
  };

  // Select dropdown styles
  select: {
    base: string;
    normal: string;
    error: string;
    disabled: string;
  };

  // Boolean checkbox styles
  booleanCheckbox: {
    container: string;
    input: string;
    label: string;
    description: string;
  };

  // Checkbox group styles (for multi-select)
  checkboxGroup: {
    container: string;
    optionContainer: string;
    optionLabel: string;
    checkbox: string;
  };

  // Date field styles
  dateInput: {
    base: string;
    normal: string;
    error: string;
    disabled: string;
  };

  // Unsupported field type warning
  unsupportedField: {
    container: string;
    message: string;
  };
}

export const defaultFormTheme: IFormTheme = {
  form: {
    container: "space-y-2",
    titleSection: "border-b border-gray-200 pb-4",
    title: "text-2xl font-bold text-gray-900",
    description: "mt-1 text-sm text-gray-600",
    fieldsContainer: "space-y-4",
    buttonSection: "flex space-x-4 pt-4 border-t border-gray-200",
  },

  buttons: {
    submit: {
      base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 h-10 px-4 py-2 bg-stone-900 text-white hover:bg-stone-600",
      disabled: "disabled:pointer-events-none disabled:opacity-50",
    },
    reset: {
      base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 h-10 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900",
      disabled: "disabled:pointer-events-none disabled:opacity-50",
    },
  },

  field: {
    container: "mb-4",
    label: "block text-sm font-medium text-gray-700 mb-1",
    requiredIndicator: "text-red-500 ml-1",
    description: "text-sm text-gray-500 mb-1",
    errorMessage: "mt-1 text-sm text-red-600",
  },

  input: {
    base: "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    normal: "border-gray-200 bg-white",
    error: "border-red-500 bg-white",
    disabled: "bg-gray-50 cursor-not-allowed opacity-50",
    placeholder: "placeholder:text-gray-400",
  },

  textarea: {
    base: "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical",
    normal: "border-gray-200 bg-white",
    error: "border-red-500 bg-white",
    disabled: "bg-gray-50 cursor-not-allowed opacity-50 resize-none",
  },

  select: {
    base: "appearance-none flex w-full items-center justify-between rounded-md border pl-3 pr-10 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    normal: "border-gray-200 bg-white",
    error: "border-red-500 bg-white",
    disabled: "bg-gray-50 cursor-not-allowed opacity-50",
  },

  booleanCheckbox: {
    container: "flex items-center",
    input:
      "mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded",
    label: "text-sm font-medium text-gray-700",
    description: "text-sm text-gray-500 mt-1 ml-6",
  },

  checkboxGroup: {
    container: "space-y-2",
    optionContainer: "flex items-center",
    optionLabel: "text-sm text-gray-700",
    checkbox:
      "mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded",
  },

  dateInput: {
    base: "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    normal: "border-gray-200 bg-white",
    error: "border-red-500 bg-white",
    disabled: "bg-gray-50 cursor-not-allowed opacity-50",
  },

  unsupportedField: {
    container: "mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md",
    message: "text-yellow-800",
  },
};

/**
 * Deep merges a partial theme with the default theme
 * @param partialTheme - Partial theme to merge with defaults
 * @returns Complete theme with overrides applied, preserving all default properties
 */
export function mergeTheme(partialTheme?: Partial<IFormTheme>): IFormTheme {
  if (!partialTheme) {
    return defaultFormTheme;
  }

  // Deep merge helper for nested objects using cn() for className strings
  const mergeNestedObject = <T extends Record<string, any>>(
    defaultObj: T,
    partialObj?: Partial<T>
  ): T => {
    if (!partialObj) return defaultObj;

    const result = { ...defaultObj } as T;
    for (const key in partialObj) {
      if (
        typeof partialObj[key] === "string" &&
        typeof defaultObj[key] === "string"
      ) {
        // Use cn() to intelligently merge Tailwind classes
        result[key] = cn(defaultObj[key], partialObj[key]) as any;
      } else {
        result[key] = partialObj[key] as any;
      }
    }
    return result;
  };

  return {
    form: mergeNestedObject(defaultFormTheme.form, partialTheme.form),
    buttons: {
      submit: mergeNestedObject(
        defaultFormTheme.buttons.submit,
        partialTheme.buttons?.submit
      ),
      reset: mergeNestedObject(
        defaultFormTheme.buttons.reset,
        partialTheme.buttons?.reset
      ),
    },
    field: mergeNestedObject(defaultFormTheme.field, partialTheme.field),
    input: mergeNestedObject(defaultFormTheme.input, partialTheme.input),
    textarea: mergeNestedObject(
      defaultFormTheme.textarea,
      partialTheme.textarea
    ),
    select: mergeNestedObject(defaultFormTheme.select, partialTheme.select),
    booleanCheckbox: mergeNestedObject(
      defaultFormTheme.booleanCheckbox,
      partialTheme.booleanCheckbox
    ),
    checkboxGroup: mergeNestedObject(
      defaultFormTheme.checkboxGroup,
      partialTheme.checkboxGroup
    ),
    dateInput: mergeNestedObject(
      defaultFormTheme.dateInput,
      partialTheme.dateInput
    ),
    unsupportedField: mergeNestedObject(
      defaultFormTheme.unsupportedField,
      partialTheme.unsupportedField
    ),
  };
}
