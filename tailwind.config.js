/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/*.html", "./src/**/*.{vue,ts}", "./src/views/**/*.{vue,ts}", "./src/components/**/*.{vue,ts}"],
  theme: {},
  plugins: [require("tailwindcss-animated")],
};
