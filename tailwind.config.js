// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'b-white': 'var(--white)',
        'b-grey': 'var(--grey)',
        'b-black': 'var(--black)',
        'b-orange': 'var(--orange)',
        'b-orange2': 'var(--orangeLightOut)',
        'b-orangeOut': 'var(--orangeOut)',
        'b-yellow': 'var(--yellow)',
        'b-green': 'var(--green)',
        'b-violet': 'var(--violet)',
      },
      fontFamily: {
        sans: ['Urbanist', 'sans-serif'], // Set Urbanist as the default sans-serif font
      },
      fontWeight: {
        thin: "300",
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
    },
  },
  plugins: [],
};