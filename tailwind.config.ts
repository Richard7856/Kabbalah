import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Jewish/Kabbalistic color palette
        navy: {
          950: "#04071a",
          900: "#060d1f",
          800: "#0d1530",
          700: "#122040",
          600: "#1a2f5e",
        },
        gold: {
          300: "#f0d060",
          400: "#e8b840",
          500: "#c9a84c",
          600: "#a8883c",
          700: "#7a6028",
        },
        cream: {
          100: "#fdf8ee",
          200: "#f5e8c8",
          300: "#e8d5a3",
          400: "#d4b878",
        },
        slate: {
          muted: "#8a9bb8",
        },
      },
      fontFamily: {
        cinzel: ["var(--font-cinzel)", "Cinzel", "serif"],
        cormorant: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
      },
      animation: {
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "fade-in": "fade-in 0.5s ease-out forwards",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
