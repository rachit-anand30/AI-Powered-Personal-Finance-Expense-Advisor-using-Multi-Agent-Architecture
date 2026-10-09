/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      colors: {
        ink: {
          950: '#07080d',
          900: '#0c0e16',
          850: '#11131d',
          800: '#161925',
          700: '#232738',
          600: '#343a50',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(244,63,94,0.45)' },
          '70%': { boxShadow: '0 0 0 10px rgba(244,63,94,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(244,63,94,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        flow: {
          '0%': { strokeDashoffset: 24 },
          '100%': { strokeDashoffset: 0 },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-ring': 'pulse-ring 2s infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        flow: 'flow 1s linear infinite',
      },
    },
  },
  plugins: [],
}
