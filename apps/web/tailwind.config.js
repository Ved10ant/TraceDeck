/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cta: {
          DEFAULT: "#FF5A1F",
          hover: "#E84A10",
        },
        cosmo: {
          bg: "#000000",
          deep: "#06070A",
          surface: "#0C0F16",
          border: "rgba(255, 255, 255, 0.1)",
          blue: "#0175FF",
          amber: "#FFAC0A",
          gold: "#FFCD7D",
          muted: "#9BA9C4",
          silver: "#D1D4E3",
        },
        warm: {
          bg: "#F6F5F1",
          surface: "#FFFFFF",
          ink: "#0E0E10",
          muted: "#6B6B72",
          border: "#E7E5DF",
          dark: "#121316",
        },
        dark: {
          bg: "#0A0B0F",
          surface: "#12141A",
          border: "#23262F",
        },
        semantic: {
          success: "#16A34A",
          danger: "#E5484D",
          warning: "#F5A524",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        heading: ["var(--font-heading)", "Instrument Sans", "sans-serif"],
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        stat: ["var(--font-stat)", "Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        pill: "9999px",
      },
      boxShadow: {
        glow: "0 0 28px -4px rgba(255, 90, 31, 0.45)",
        blueGlow: "0 0 36px -6px rgba(1, 117, 255, 0.35)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        darkCard: "0 20px 50px -12px rgba(0, 0, 0, 0.8)",
      },
    },
  },
  plugins: [],
};
