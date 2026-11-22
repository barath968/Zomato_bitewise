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
        "bw-border": "#2A3140",
        "bw-text": "#F2F4F8",
        "bw-muted": "#9AA3B2",
        "bw-placeholder": "#525C6E",
        "bw-accent": "#E23744",
        "bw-accent-hover": "#C92F3B",
        "bw-amber": "#F59E0B",
        "bw-teal": "#71D7CF",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
