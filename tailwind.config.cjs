/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#0a0a0f',
          surface: '#12121a',
          'surface-elevated': '#1a1a2e',
          primary: '#7c3aed',
          'primary-hover': '#8b5cf6',
          accent: '#a78bfa',
          'text-primary': '#e2e8f0',
          'text-secondary': '#94a3b8',
          border: '#2d2d44',
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(124,58,237,0.3)',
        'glow-sm': '0 0 10px rgba(124,58,237,0.2)',
        'glow-lg': '0 0 40px rgba(124,58,237,0.4)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(124,58,237,0.5)' },
        }
      }
    }
  },
  plugins: []
}
