/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Rajdhani"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        radar: {
          bg: '#f1f5f9',
          panel: '#ffffff',
          border: '#e2e8f0',
          accent: '#0284c7',
          danger: '#dc2626',
          warn: '#d97706',
          ok: '#059669',
          muted: '#64748b',
          dark: '#1e293b',
          mid: '#475569',
        },
      },
    },
  },
  plugins: [],
}

