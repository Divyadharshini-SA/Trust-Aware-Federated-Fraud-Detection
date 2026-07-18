module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0A1628',
          teal: '#00D4FF',
          green: '#00FF88',
          amber: '#FFB800',
          red: '#FF4D4D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
