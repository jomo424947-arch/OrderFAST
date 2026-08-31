import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F0EEE8",
        surface: "#FAF8F3",
        line: "#D8CFBE",
        ink: {
          DEFAULT: "#241F1A",
          soft: "#6B6255",
        },
        primary: {
          DEFAULT: "#E8992A",
          ink: "#5C3B08",
          soft: "#FBEBD1",
          hover: "#D68619",
        },
        accent: {
          DEFAULT: "#2F5233",
          soft: "#E3ECE1",
          hover: "#254228",
        },
        danger: {
          DEFAULT: "#B23A2E",
          soft: "#F9EAE8",
          hover: "#9B3126",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "'El Messiri'", "'Segoe UI'", "Tahoma", "sans-serif"],
        body: ["var(--font-body)", "'IBM Plex Sans Arabic'", "'Segoe UI'", "Tahoma", "sans-serif"],
        mono: ["var(--font-mono)", "'IBM Plex Mono'", "'Courier New'", "monospace"],
      },
      boxShadow: {
        warm: "0 4px 20px -2px rgba(36, 31, 26, 0.06), 0 2px 6px -1px rgba(36, 31, 26, 0.04)",
        ticket: "0 10px 30px -5px rgba(36, 31, 26, 0.08)",
        floating: "0 12px 32px -4px rgba(36, 31, 26, 0.12)",
        glow: "0 0 24px -4px rgba(232, 153, 42, 0.4)",
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
      }
    },
  },
  plugins: [],
};

export default config;
