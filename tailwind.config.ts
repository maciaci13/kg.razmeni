import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        body: ["var(--font-onest)", "Onest", "system-ui", "sans-serif"],
        sans: ["var(--font-onest)", "Onest", "system-ui", "sans-serif"]
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        peach: "var(--peach)",
        sage: "var(--sage)",
        mist: "var(--mist)",
        butter: "var(--butter)",
        clay: "var(--clay)",
        ember: "var(--ember)",
        cocoa: "var(--cocoa)",
        brown: "var(--brown)",
        ink: "var(--foreground)",
        paper: "var(--secondary)",
        milk: "var(--card)",
        beige: "var(--accent)",
        orange: "var(--primary)",
        lime: "var(--sage)"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-glow)",
        pill: "var(--shadow-pill)"
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 8px)",
        "2xl": "calc(var(--radius) + 16px)",
        "3xl": "calc(var(--radius) + 24px)",
        organic: "calc(var(--radius) + 16px)"
      },
      backgroundImage: {
        "gradient-warm": "var(--gradient-warm)",
        "gradient-ember": "var(--gradient-ember)",
        "gradient-sage": "var(--gradient-sage)",
        "gradient-mist": "var(--gradient-mist)",
        "gradient-butter": "var(--gradient-butter)",
        "gradient-cocoa": "var(--gradient-cocoa)"
      }
    }
  },
  plugins: []
};

export default config;
