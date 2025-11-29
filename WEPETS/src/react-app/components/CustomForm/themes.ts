

import { IFormTheme } from "./defaultTheme";

export const formTheme: IFormTheme = {
  form: {
    className: "space-y-8 w-full max-w-lg mx-auto",
  },
  field: {
    className: "space-y-3 group",
  },
  label: {
    className: "block text-sm font-black text-black uppercase tracking-widest mb-1 group-focus-within:text-orange-600 transition-colors",
  },
  input: {
    className:
      "w-full px-6 py-4 bg-white border-2 border-gray-200 focus:border-black focus:ring-0 outline-none transition-all duration-300 font-bold text-lg text-black placeholder-gray-300 rounded-none shadow-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    errorClassName: "border-red-500 bg-red-50 focus:border-red-500 focus:shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]",
  },
  select: {
    className:
      "w-full px-6 py-4 bg-white border-2 border-gray-200 focus:border-black focus:ring-0 outline-none transition-all duration-300 font-bold text-lg text-black rounded-none appearance-none shadow-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  },
  textarea: {
    className:
      "w-full px-6 py-4 bg-white border-2 border-gray-200 focus:border-black focus:ring-0 outline-none transition-all duration-300 font-bold text-lg text-black placeholder-gray-300 rounded-none min-h-[120px] shadow-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  },
  checkbox: {
    className:
      "h-6 w-6 text-black border-2 border-gray-300 rounded-none focus:ring-0 cursor-pointer checked:bg-black checked:border-black transition-all duration-200",
    labelClassName: "ml-3 text-base font-bold text-gray-900 cursor-pointer select-none",
  },
  error: {
    className: "text-xs font-black text-red-600 mt-2 uppercase tracking-wider flex items-center gap-1",
  },
  submitButton: {
    className:
      "w-full py-5 bg-black text-white font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all duration-300 border-2 border-transparent hover:border-black text-xl shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:translate-y-0 active:shadow-none",
    loadingClassName: "opacity-80 cursor-wait",
  },
};
  
