import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(45, 212, 191, 0.14), 0 18px 48px rgba(8, 47, 73, 0.32)",
        card: "0 20px 60px rgba(2, 6, 23, 0.26)"
      },
      backgroundImage: {
        "premium-mesh":
          "radial-gradient(circle at 10% 0%, rgba(16, 185, 129, 0.18), transparent 28%), radial-gradient(circle at 92% 8%, rgba(99, 102, 241, 0.16), transparent 26%), linear-gradient(145deg, #020617 0%, #07111f 47%, #031c21 100%)"
      }
    }
  },
  plugins: [animate]
};

export default config;
