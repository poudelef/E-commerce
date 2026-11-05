import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        background: "var(--color-background)",
        accent: "var(--color-accent)",
        "accent-text": "var(--color-accent-text)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        card: "var(--color-card)",
      },
      boxShadow: {
        card: "0 8px 24px rgba(43, 43, 43, 0.08)",
        pop: "0 16px 40px rgba(43, 43, 43, 0.16)",
      },
      borderRadius: {
        card: "14px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
