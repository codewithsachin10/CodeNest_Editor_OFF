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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // VS Code-style theme colors
        titlebar: {
          DEFAULT: "hsl(var(--titlebar-bg))",
          foreground: "hsl(var(--titlebar-fg))",
          border: "hsl(var(--titlebar-border))",
        },
        activity: {
          DEFAULT: "hsl(var(--activity-bg))",
          foreground: "hsl(var(--activity-fg))",
          active: "hsl(var(--activity-active))",
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
          header: "hsl(var(--sidebar-header))",
          hover: "hsl(var(--sidebar-hover))",
        },
        editor: {
          DEFAULT: "hsl(var(--editor-background))",
          foreground: "hsl(var(--editor-foreground))",
          "line-number": "hsl(var(--editor-line-number))",
          "line-number-active": "hsl(var(--editor-line-number-active))",
          selection: "hsl(var(--editor-selection))",
          "active-line": "hsl(var(--editor-active-line))",
          gutter: "hsl(var(--editor-gutter))",
          "indent-guide": "hsl(var(--editor-indent-guide))",
          keyword: "hsl(var(--editor-keyword))",
          string: "hsl(var(--editor-string))",
          comment: "hsl(var(--editor-comment))",
          function: "hsl(var(--editor-function))",
          variable: "hsl(var(--editor-variable))",
          number: "hsl(var(--editor-number))",
          operator: "hsl(var(--editor-operator))",
        },
        tab: {
          DEFAULT: "hsl(var(--tab-bg))",
          active: "hsl(var(--tab-active-bg))",
          hover: "hsl(var(--tab-hover-bg))",
          border: "hsl(var(--tab-border))",
          "active-border": "hsl(var(--tab-active-border))",
        },
        terminal: {
          DEFAULT: "hsl(var(--terminal-background))",
          foreground: "hsl(var(--terminal-foreground))",
          border: "hsl(var(--terminal-border))",
          header: "hsl(var(--terminal-header))",
        },
        footer: {
          DEFAULT: "hsl(var(--footer-background))",
          border: "hsl(var(--footer-border))",
          foreground: "hsl(var(--footer-fg))",
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
        "progress-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "cursor-blink": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "progress-pulse": "progress-pulse 2s ease-in-out infinite",
        "cursor-blink": "cursor-blink 1s step-end infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
