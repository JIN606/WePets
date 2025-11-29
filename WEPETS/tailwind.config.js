/** @type {import('tailwindcss').Config} */
import tailwindcssMotion from 'tailwindcss-motion';

export default {
  content: ['./src/react-app/**/*.{html,js,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssMotion],
};
