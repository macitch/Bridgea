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
        }
      },
    },
    plugins: [],
  };