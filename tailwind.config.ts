import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        body: ["var(--font-onest)", "Onest", "Sofia Sans", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#faf8f5",
        foreground: "#332820",
        card: {
          DEFAULT: "#fdfcfa",
          foreground: "#332820",
        },
        primary: {
          DEFAULT: "#dc7840",
          foreground: "#fefefe",
        },
        secondary: {
          DEFAULT: "#f3ede5",
          foreground: "#4e3428",
        },
        muted: {
          DEFAULT: "#ede8e0",
          foreground: "#7a6c5c",
        },
        accent: {
          DEFAULT: "#eee4d5",
          foreground: "#4e3428",
        },
        destructive: {
          DEFAULT: "#c44030",
          foreground: "#fefefe",
        },
        border: "#e6e0d8",
        input: "#ede8e0",
        ring: "#dc7840",
        ember: "#dc7840",
        sage: "#74a860",
        mist: "#96bcc8",
        butter: "#efe5c4",
        clay: "#7c6048",
        cocoa: "#4e3428",
        peach: "#f0d8c0",
        // Legacy aliases kept for backward compat with playground route
        ink: "#332820",
        paper: "#faf8f5",
        milk: "#fdfcfa",
        beige: "#e6e0d8",
        orange: "#dc7840",
        lime: "#d8ecc8",
        lavender: "#e0d0f0",
      },
      borderRadius: {
        organic: "2rem",
      },
      boxShadow: {
        soft: "0 16px 40px -14px rgba(64,40,24,.18)",
        glow: "0 20px 40px -10px rgba(220,120,64,.34)",
        pill: "0 14px 30px -12px rgba(64,40,24,.18)",
      },
    },
  },
  plugins: [],
};

export default config;
