/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sleek dark-mode curated colors (as per user experience guidance)
        dark: {
          bg: '#0B0F19',       // Deep navy background
          card: '#161F30',     // Premium card background
          border: '#23324C',   // Subtle border color
          accent: '#3B82F6',   // Neon blue highlights
        },
        dokkan: {
          agl: '#3B82F6',      // Blue
          teq: '#10B981',      // Green
          int: '#8B5CF6',      // Purple
          str: '#EF4444',      // Red
          phy: '#F59E0B',      // Yellow
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
