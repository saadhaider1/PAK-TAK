import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed', // Violet-600
          dark: '#5b21b6',    // Violet-800
          light: '#a78bfa',   // Violet-400
        },
        secondary: {
          DEFAULT: '#06b6d4', // Cyan-500
          dark: '#0e7490',    // Cyan-700
          light: '#67e8f9',   // Cyan-300
        },
        dark: {
          bg: '#0f172a',      // Slate-900
          card: '#1e293b',    // Slate-800
          text: '#f8fafc',    // Slate-50
        }
      },
    },
  },
  plugins: [],
};
export default config;
