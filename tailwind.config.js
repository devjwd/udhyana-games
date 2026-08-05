import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090c",
        surface: {
          DEFAULT: "#0f1319",
          card: "#141922",
          border: "#1f2735",
        },
        neon: {
          lime: "#39FF14",
          limeHover: "#32e010",
          limeLight: "#67ff49",
        },
        muted: "#94a3b8",
      },
      boxShadow: {
        neon: "0 0 15px rgba(57, 255, 20, 0.4)",
        "neon-lg": "0 0 30px rgba(57, 255, 20, 0.6)",
        "neon-inset": "inset 0 0 15px rgba(57, 255, 20, 0.2)",
      },
    },
  },
  plugins: [],
} satisfies Config;
