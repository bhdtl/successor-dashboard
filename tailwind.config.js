/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        successor: {
          bg: '#0d0e10',
          card: 'rgba(22, 24, 30, 0.72)',
          border: 'rgba(255, 255, 255, 0.08)',
          textMuted: 'rgba(255, 255, 255, 0.55)',
          mint: '#00ff88',
          accent: '#ffffff',
          darkMint: '#00cc6a'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"SF Pro"',
          '"SF Compact"',
          'Inter',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
