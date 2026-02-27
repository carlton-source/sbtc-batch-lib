import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Satoshi", "Inter", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "Fira Code", "Cascadia Code", "monospace"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // BatchPay custom tokens
        violet: {
          DEFAULT: "hsl(var(--violet))",
          dark: "hsl(var(--violet-dark))",
          50: "hsl(262 100% 97%)",
          100: "hsl(262 100% 94%)",
          200: "hsl(262 96% 87%)",
          300: "hsl(262 91% 77%)",
          400: "hsl(264 86% 70%)",
          500: "hsl(262 83% 62%)",
          600: "hsl(262 83% 58%)",
          700: "hsl(264 75% 48%)",
          800: "hsl(263 70% 35%)",
          900: "hsl(263 67% 24%)",
          950: "hsl(263 70% 14%)",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          50: "hsl(48 100% 96%)",
          100: "hsl(48 96% 89%)",
          200: "hsl(44 96% 78%)",
          300: "hsl(43 96% 66%)",
          400: "hsl(40 96% 57%)",
          500: "hsl(38 92% 50%)",
          600: "hsl(34 90% 44%)",
        },
        emerald: {
          DEFAULT: "hsl(var(--emerald))",
          dark: "hsl(var(--emerald-dark))",
          400: "hsl(160 84% 55%)",
          500: "hsl(160 84% 39%)",
          600: "hsl(160 84% 28%)",
        },
        surface: {
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
          4: "hsl(var(--surface-4))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 15px hsl(262 83% 66% / 0.3)" },
          "50%": { boxShadow: "0 0 30px hsl(262 83% 66% / 0.6), 0 0 60px hsl(262 83% 66% / 0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease-out forwards",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, hsl(263 70% 8%) 0%, hsl(220 39% 5%) 50%, hsl(218 50% 7%) 100%)",
        "violet-gold": "linear-gradient(135deg, hsl(var(--violet)), hsl(var(--gold)))",
      },
      boxShadow: {
        "violet-glow": "0 0 20px hsl(262 83% 66% / 0.3), 0 0 60px hsl(262 83% 66% / 0.1)",
        "gold-glow": "0 0 20px hsl(38 92% 50% / 0.4), 0 0 60px hsl(38 92% 50% / 0.15)",
        "card-dark": "0 4px 24px hsl(222 47% 2% / 0.6)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
