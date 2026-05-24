import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        moss: "#66715b",
        clay: "#b86f52",
        paper: "#f7f4ee",
        line: "#ded8cc"
      }
    }
  },
  plugins: []
};

export default config;
