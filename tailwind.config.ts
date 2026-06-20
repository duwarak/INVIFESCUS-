import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        polymath: {
          bg: "#0f0f14",
          surface: "#1a1a24",
          border: "#2a2a3a",
          accent: "#7c5cfc",
          "accent-light": "#a78bfa",
          teal: "#2dd4bf",
          coral: "#fb7185",
          amber: "#fbbf24",
          text: "#e2e2e8",
          muted: "#8888a0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
