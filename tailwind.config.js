module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0A1628',
          cyan: '#00D4FF',
          green: '#00FF88',
          amber: '#FFB800',
          red: '#FF4D4D',
          purple: '#8B5CF6',
        },
        neon: {
          cyan: '#00E5FF',
          green: '#00FF9D',
          red: '#FF5A5A',
          purple: '#8B5CF6',
          amber: '#FFB547',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 229, 255, 0.25)',
        'neon-green': '0 0 15px rgba(0, 255, 157, 0.25)',
        'neon-red': '0 0 15px rgba(255, 90, 90, 0.25)',
        'neon-purple': '0 0 15px rgba(139, 92, 246, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
