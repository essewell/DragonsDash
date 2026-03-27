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
        navy: {
          900: "#0A192F",
          800: "#0F2744",
          700: "#153560",
          600: "#1B4380",
          500: "#2151A0",
          400: "#4A6FBF",
          300: "#7A9AD9",
          200: "#A8C1E8",
          100: "#D4E0F4",
          50: "#EAF0FA",
        },
        warm: {
          50: "#FAFAF7",
          100: "#F5F5F0",
          200: "#E8E8E0",
          300: "#D4D4C8",
          400: "#B0B0A4",
          500: "#8C8C80",
          600: "#68685C",
          700: "#4A4A40",
          800: "#2C2C24",
          900: "#1A1A14",
        },
        burnt: {
          DEFAULT: "#CC5500",
          light: "#E06800",
          dark: "#A84400",
        },
        forest: {
          DEFAULT: "#228B22",
          light: "#2EA32E",
          dark: "#1A6B1A",
        },
        amber: {
          DEFAULT: "#D4A017",
          light: "#E8B42A",
          dark: "#B08810",
        },
        danger: "#DC2626",
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', "SF Mono", "Menlo", "monospace"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        display: ['"Libre Baskerville"', "Georgia", "serif"],
      },
      spacing: {
        "0.5": "4px",
        "1": "8px",
        "1.5": "12px",
        "2": "16px",
        "2.5": "20px",
        "3": "24px",
        "4": "32px",
        "5": "40px",
        "6": "48px",
        "7": "56px",
        "8": "64px",
        "9": "72px",
        "10": "80px",
        "12": "96px",
        "14": "112px",
        "16": "128px",
        "20": "160px",
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["15px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["22px", { lineHeight: "32px" }],
        "2xl": ["28px", { lineHeight: "36px" }],
        "3xl": ["36px", { lineHeight: "44px" }],
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "4px",
        lg: "4px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(10, 25, 47, 0.06)",
        elevated: "0 4px 12px rgba(10, 25, 47, 0.1)",
      },
      gridTemplateColumns: {
        "12": "repeat(12, minmax(0, 1fr))",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
