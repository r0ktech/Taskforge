import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "Lexend",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "ui-sans-serif",
          "system-ui",
        ],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Consolas", "ui-monospace", "monospace"],
      },
      colors: {
        canvas: "hsl(var(--canvas) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-raised": "hsl(var(--surface-raised) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        "border-strong": "hsl(var(--border-strong) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        "ink-muted": "hsl(var(--ink-muted) / <alpha-value>)",
        "ink-faint": "hsl(var(--ink-faint) / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          hover: "hsl(var(--accent-hover) / <alpha-value>)",
          muted: "hsl(var(--accent-muted) / <alpha-value>)",
        },
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        panel: "0 12px 32px -8px rgb(0 0 0 / 0.18), 0 4px 12px -4px rgb(0 0 0 / 0.08)",
        "focus-ring": "0 0 0 3px hsl(var(--accent) / 0.35)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "slide-up": "slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
