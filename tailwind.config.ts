import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-cal-sans)", "Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      colors: {
        canvas: "var(--canvas)",
        "surface-soft": "var(--surface-soft)",
        "surface-card": "var(--surface-card)",
        "surface-strong": "var(--surface-strong)",
        "surface-dark": "var(--surface-dark)",
        "surface-dark-elevated": "var(--surface-dark-elevated)",
        hairline: "var(--hairline)",
        "hairline-soft": "var(--hairline-soft)",
        ink: "var(--ink)",
        body: "var(--body)",
        muted: "var(--muted)",
        "muted-soft": "var(--muted-soft)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "on-primary": "var(--on-primary)",
        "on-dark": "var(--on-dark)",
        "on-dark-soft": "var(--on-dark-soft)",
        "brand-accent": "var(--brand-accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        "badge-orange": "var(--badge-orange)",
        "badge-pink": "var(--badge-pink)",
        "badge-violet": "var(--badge-violet)",
        "badge-emerald": "var(--badge-emerald)",
        
        // Mapping old generic shadcn variables so that any legacy components don't instantly break
        background: "var(--canvas)",
        foreground: "var(--ink)",
        card: "var(--surface-card)",
        "card-foreground": "var(--ink)",
        border: "var(--hairline)",
        input: "var(--hairline)",
        ring: "var(--primary)",
        accent: "var(--surface-strong)",
        "accent-foreground": "var(--ink)",
        destructive: "var(--error)",
        "destructive-foreground": "#ffffff"
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px"
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.12)",
        soft: "0 1px 2px rgba(0,0,0,0.05)"
      }
    }
  },
  plugins: [animate]
};

export default config;
