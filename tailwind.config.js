const config = {
 
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))", // silverMist
        input: "hsl(var(--input))", // silverMist (or a slightly darker variant)
        ring: "hsl(var(--ring))", // pacificTeal or goldenHour

        background: "hsl(var(--background))", // californiaSand
        foreground: "hsl(var(--foreground))", // graphitePeak

        primary: {
          DEFAULT: "hsl(var(--primary))", // midnightCove
          foreground: "hsl(var(--primary-foreground))", // californiaSand or light variant
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))", // pacificTeal
          foreground: "hsl(var(--secondary-foreground))", // californiaSand or graphitePeak
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))", // silverMist (lighter shade)
          foreground: "hsl(var(--muted-foreground))", // graphitePeak (lighter shade)
        },
        accent: {
          DEFAULT: "hsl(var(--accent))", // goldenHour
          foreground: "hsl(var(--accent-foreground))", // midnightCove or graphitePeak
        },
        popover: {
          DEFAULT: "hsl(var(--popover))", // californiaSand
          foreground: "hsl(var(--popover-foreground))", // graphitePeak
        },
        card: {
          DEFAULT: "hsl(var(--card))", // californiaSand (or a slightly brighter variant like white)
          foreground: "hsl(var(--card-foreground))", // graphitePeak
        },
        // Custom colors for the redesign
        brand: {
          californiaSand: "hsl(35, 40%, 92%)", // Main BG
          midnightCove: "hsl(220, 35%, 28%)", // Primary Headings, Key Branding
          graphitePeak: "hsl(220, 15%, 25%)", // Body Text, Secondary Headings
          goldenHour: "hsl(40, 60%, 70%)", // Premium Accents, Special CTAs
          sunsetBlush: "hsl(15, 65%, 65%)", // Primary CTAs, Active Highlights
          pacificTeal: "hsl(180, 40%, 45%)", // Secondary Interactive, Links, Info Icons
          silverMist: "hsl(210, 20%, 88%)", // Borders, Inputs, Subtle Dividers
          white: "hsl(0, 0%, 100%)", // For high contrast on dark BGs or card BGs
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Manrope", "Georgia", "serif"],
      },
      boxShadow: {
        subtle: "0 4px 12px rgba(0, 0, 0, 0.05)",
        medium: "0 8px 24px rgba(0, 0, 0, 0.08)",
        strong: "0 12px 36px rgba(0, 0, 0, 0.12)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
