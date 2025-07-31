/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all .js, .jsx, .ts, .tsx files in the src directory and its subdirectories
    "./public/index.html",         // Include your main HTML file if classes are used there
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

