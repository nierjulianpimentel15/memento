import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        'near-black': '#111111',
        'dark-gray': '#1A1A1A',
        'medium-gray': '#3A3A3A',
        'light-gray': '#CFCFCF',
        white: '#FFFFFF',
        border: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '16px',
        xl: '20px',
        md: '12px',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.35)',
        elevate: '0 20px 60px rgba(0,0,0,0.5)',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
