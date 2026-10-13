import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#0E0D0C',
        stone: { DEFAULT: '#2A2622', deep: '#1A1816', line: '#3A352F' },
        amber: { DEFAULT: '#E8A866', soft: '#F0C89A' },
        bone: '#F2EEE8',
        wave: '#3B82F6',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wide3: '0.3em',
        wide2: '0.2em',
      },
      maxWidth: { site: '84rem' },
    },
  },
  plugins: [],
};

export default config;
