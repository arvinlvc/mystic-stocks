import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-low": "rgb(var(--surface-low) / <alpha-value>)",
        "surface-high": "rgb(var(--surface-high) / <alpha-value>)",
        "surface-highest": "rgb(var(--surface-highest) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        tertiary: "rgb(var(--tertiary) / <alpha-value>)",
        outline: "rgb(var(--outline) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)"
      },
      boxShadow: {
        glow: "0 12px 32px rgba(242, 202, 80, 0.20)",
        jade: "0 10px 28px rgba(89, 222, 155, 0.22)"
      },
      fontFamily: {
        display: ["var(--font-serif)"],
        body: ["var(--font-manrope)"],
        label: ["var(--font-space)"]
      },
      backgroundImage: {
        aurora:
          "radial-gradient(circle at top, rgba(48, 53, 65, 0.95), rgba(14, 19, 30, 0.2) 38%, rgba(14, 19, 30, 1) 72%)",
        parchment:
          "radial-gradient(circle at 20% 20%, rgba(242, 202, 80, 0.08), transparent 28%), radial-gradient(circle at 80% 0%, rgba(89, 222, 155, 0.08), transparent 22%), linear-gradient(180deg, rgba(48, 53, 65, 0.25), rgba(14, 19, 30, 0.92))"
      }
    }
  },
  plugins: []
};

export default config;
