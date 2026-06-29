/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        pk: {
          bg: "#0a0a0f",
          panel: "#111118",
          input: "#1a1a24",
          border: "#2d2d3d",
          text: "#fafafa",
          muted: "#ffffff",
          accent: "#7c3aed",
          accentHover: "#6d28d9",
          accentGlow: "#7c3aed22",
          success: "#10b981",
          danger: "#ef4444",
        },
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        gradient: "gradientShift 10s ease-in-out infinite",
        glow: "glowPulse 3.2s ease-in-out infinite",
      },
      borderRadius: {
        pk: "10px",
      },
      boxShadow: {
        glow: "0 0 0 1px #7c3aed22, 0 10px 30px -20px #7c3aed66",
      },
    },
  },
  plugins: [],
};
