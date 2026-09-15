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
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],

        // "FFCS Planner" skin (/new/*) — additive only, never referenced outside src/app/new and src/components/fp-ui
        "fp-display": ["var(--fp-font-display)", "Space Grotesk", "sans-serif"],
        "fp-body": ["var(--fp-font-body)", "IBM Plex Sans", "sans-serif"],
        "fp-mono": ["var(--fp-font-mono)", "IBM Plex Mono", "ui-monospace", "monospace"]
      },
      colors: {
        // "FFCS Planner" skin (/new/*) tokens — additive only, prefixed so no existing class can collide
        "fp-ground": "var(--ground)",
        "fp-surface": "var(--surface)",
        "fp-ink": "var(--ink)",
        "fp-muted": "var(--muted)",
        "fp-accent": "var(--accent)",
        "fp-accent-bright": "var(--accent-bright)",
        "fp-accent-dim": "var(--accent-dim)",
        "fp-rule": "var(--rule)",
        "fp-bg-page": "var(--bg-page)",
        "fp-bg-surface": "var(--bg-surface)",
        "fp-bg-raised": "var(--bg-raised)",
        "fp-bg-inset": "var(--bg-inset)",
        "fp-text-body": "var(--text-body)",
        "fp-text-strong": "var(--text-strong)",
        "fp-text-dim": "var(--text-dim)",
        "fp-text-accent": "var(--text-accent)",
        "fp-text-on-accent": "var(--text-on-accent)",
        "fp-border-default": "var(--border-default)",
        "fp-border-strong": "var(--border-strong)",
        "fp-border-accent": "var(--border-accent)",
        "fp-warn": "var(--warn)",
        "fp-danger": "var(--danger)",
        "fp-block-1": "var(--block-1)",
        "fp-block-2": "var(--block-2)",
        "fp-block-3": "var(--block-3)",
        "fp-block-4": "var(--block-4)",
        "fp-c1": "var(--c1)",
        "fp-c2": "var(--c2)",
        "fp-c3": "var(--c3)",
        "fp-c4": "var(--c4)",
        "fp-c5": "var(--c5)",
        "fp-busy": "var(--busy)",
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
