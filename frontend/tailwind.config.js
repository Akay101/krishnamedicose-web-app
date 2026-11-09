/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Krishna Medicose brand teal (healthcare cross)
        brand: {
          50: "#EFFCF9",
          100: "#D3F6EE",
          200: "#A9ECDD",
          300: "#70DBC7",
          400: "#38C2AC",
          500: "#16A692",
          600: "#0D8576",
          700: "#0F6A60",
          800: "#11554E",
          900: "#124641",
          950: "#042A27",
        },
        // Ink: slightly blue-tinted neutrals for type and surfaces
        ink: {
          50: "#F5F7FA",
          100: "#EBEFF4",
          200: "#D8DFE8",
          300: "#B6C1CF",
          400: "#8D9AAD",
          500: "#66758B",
          600: "#4A586D",
          700: "#354255",
          800: "#1F2A3A",
          900: "#111A28",
          950: "#0A111C",
        },
        // Peacock-feather gold accent
        saffron: {
          50: "#FFF9EB",
          100: "#FEEFC7",
          200: "#FDDD8A",
          300: "#FCC54D",
          400: "#FBB024",
          500: "#F5920B",
          600: "#D96E06",
        },
        canvas: "#F6FAF9",
        // Legacy aliases used across existing screens
        primary: {
          DEFAULT: "#16A692",
          dark: "#0F6A60",
        },
        secondary: {
          DEFAULT: "#38BDF8",
          dark: "#0284C7",
        },
        dark: {
          DEFAULT: "#0A111C",
          lighter: "#111A28",
          card: "#1F2A3A",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // Existing headings use `font-outfit`; map it onto the new display face
        outfit: ["'Plus Jakarta Sans'", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px -4px rgba(16, 24, 40, 0.08)",
        lift: "0 2px 4px rgba(16, 24, 40, 0.04), 0 18px 40px -12px rgba(16, 24, 40, 0.18)",
        glow: "0 10px 40px -10px rgba(22, 166, 146, 0.45)",
        ring: "0 0 0 1px rgba(16, 24, 40, 0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      maxWidth: {
        page: "80rem",
      },
      animation: {
        "gradient-x": "gradient-x 15s ease infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "fade-up": "fade-up .7s cubic-bezier(.2,.7,.2,1) both",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(.2,.7,.2,1) infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-size": "200% 200%", "background-position": "left center" },
          "50%": { "background-size": "200% 200%", "background-position": "right center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(.9)", opacity: 0.7 },
          "80%, 100%": { transform: "scale(1.9)", opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
