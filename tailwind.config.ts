import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171712",
        paper: "#F7F3EA",
        milk: "#FFFDF8",
        beige: "#E9DDC9",
        orange: "#F47A38",
        lime: "#BEEB7A",
        lavender: "#BDA7FF"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(23, 23, 18, 0.10)"
      },
      borderRadius: {
        organic: "2rem"
      }
    }
  },
  plugins: []
};

export default config;
