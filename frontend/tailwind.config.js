/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          850: '#172033',
          950: '#0a1120',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(34,197,94,0.25)',
        'glow-amber':  '0 0 20px rgba(245,158,11,0.25)',
        'glow-red':    '0 0 20px rgba(239,68,68,0.25)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.25)',
      },
    },
  },
  plugins: [],
};
