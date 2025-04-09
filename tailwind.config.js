/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse-slow 3s infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { 
            boxShadow: '0 0 15px 5px rgba(255, 255, 255, 0.6)' 
          },
          '50%': { 
            boxShadow: '0 0 25px 10px rgba(255, 255, 255, 0.6)' 
          },
        },
      },
    },
  },
  plugins: [],
}
