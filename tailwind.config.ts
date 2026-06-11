import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        aegis: {
          'bg-base':       '#FAFAF8',
          'bg-card':       '#FFFFFF',
          'bg-subtle':     '#F4F1EC',
          'bg-dark':       '#1C2B2A',
          'brand':         '#2D7A6B',
          'brand-light':   '#4BA898',
          'brand-soft':    '#E8F5F2',
          'brand-dark':    '#1A5C50',
          'accent':        '#C4784A',
          'accent-soft':   '#FAF0E8',
          'text-primary':  '#1C2B2A',
          'text-body':     '#3D4F4E',
          'text-muted':    '#7A908E',
          'text-subtle':   '#A8BFBD',
          'border':        '#E2DDD6',
          'border-strong': '#C8C3BC',
          'success':       '#2D7A6B',
          'warning':       '#C4784A',
          'danger':        '#C0392B',
          'neutral':       '#8A9E9C',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        floating: '0 20px 60px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
