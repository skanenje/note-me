/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/**/*.{svelte,js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#7c3aed',
        secondary: '#06b6d4',
        accent:    '#7c3aed',
        surface:   '#161b22',
        surface2:  '#1c2330',
        border:    '#30363d',
        success:   '#10b981',
        warning:   '#f59e0b',
        danger:    '#ef4444',
        'text-primary':   '#e6edf3',
        'text-secondary': '#8b949e',
        'text-muted':     '#484f58',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 250ms ease forwards',
        'slide-up':   'slideUp 300ms cubic-bezier(0.4,0,0.2,1) forwards',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 8px rgba(124,58,237,0.2)' }, '50%': { boxShadow: '0 0 24px rgba(124,58,237,0.5)' } },
      },
      backdropBlur: { glass: '16px' },
    },
  },
  plugins: [],
}

