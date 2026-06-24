import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1565C0",
          dark: "#0D47A1",
          light: "#42A5F5",
        },
        money: {
          due: "#D32F2F",
          paid: "#2E7D32",
        },
      },
      fontSize: {
        // Larger defaults for a 50-year-old user
        base: ["18px", "1.5"],
        lg: ["20px", "1.5"],
        xl: ["24px", "1.4"],
        "2xl": ["28px", "1.3"],
        "3xl": ["34px", "1.2"],
        "4xl": ["42px", "1.1"],
      },
      minHeight: {
        touch: "64px",
      },
    },
  },
  plugins: [],
};

export default config;
