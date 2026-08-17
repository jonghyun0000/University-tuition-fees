import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#f9f9f7', surface: '#fbfbfa',
        ink: '#0b0b0b', ink2: '#52514e', muted: '#6b6963',
        line: '#e1e0d9', axis: '#c3c2b7', accent: '#2a78d6',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Apple SD Gothic Neo', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
