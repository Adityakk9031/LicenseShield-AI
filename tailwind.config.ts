import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0E14',
          surface: '#11141D',
          elevated: '#171B26',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        brand: {
          indigo: '#6366F1',
          cyan: '#06B6D4',
          cyanGlow: '#00F2FE',
          emerald: '#10B981',
          rose: '#EF4444',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.25)',
        'glow-indigo': '0 0 25px rgba(99, 102, 241, 0.25)',
        'glass-card': '0 20px 50px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
