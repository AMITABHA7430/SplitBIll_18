/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        midnight: {
          950: '#04060f',
          900: '#070b1c',
          800: '#0b1230',
          700: '#111a47',
          600: '#1a2560'
        },
        emerald: {
          glow: '#34f0b1'
        },
        violet: {
          glow: '#8b7bff'
        }
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(52,240,177,0.45)',
        'glow-violet': '0 0 40px -8px rgba(139,123,255,0.5)'
      },
      backdropBlur: {
        xl: '24px'
      },
      animation: {
        'float-slow': 'float 14s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite'
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-20px,0)' }
        }
      }
    }
  },
  plugins: []
}
