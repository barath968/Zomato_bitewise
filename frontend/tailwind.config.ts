import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "bw-bg": "#0B0D10",
        "bw-surface": "#14181F",
        "bw-elevated": "#1A1F29",
        "bw-high": "#282A2D",
        "bw-highest": "#333538",
        "bw-border": "#2A3140",
        "bw-text": "#F2F4F8",
        "bw-muted": "#9AA3B2",
        "bw-variant": "#e4bebc",
        "bw-placeholder": "#525C6E",
        "bw-accent": "#E23744",
        "bw-accent-bright": "#ff535a",
        "bw-accent-hover": "#C92F3B",
        "bw-accent-soft": "#ffb3b1",
        "bw-amber": "#F59E0B",
        "bw-amber-bright": "#ee9800",
        "bw-teal": "#71D7CF",
        "bw-teal-deep": "#32a099",
        "bw-error": "#ffb4ab",
        "bw-error-bg": "#93000a",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 32px -4px rgba(0, 0, 0, 0.6)",
        dock: "0 8px 24px -2px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [],
} satisfies Config;
