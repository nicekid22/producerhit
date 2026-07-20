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
          accent: "#c026d3",
          accentHover: "#a21caf",
          accentGlow: "#c026d322",
          success: "#10b981",
          danger: "#ef4444",
        },
        // Cloud Drip palette — producerhit-refonte-prompt.md §6
        cd: {
          ink: "#16151B",
          cloud: "#F4F0E8",
          coral: "#FF5B35",
          periwinkle: "#8EA2FF",
          concrete: "#8B877E",
          static: "#2A2833",
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
        v2: "16px",
        v2lg: "20px",
      },
      boxShadow: {
        glow: "0 0 0 1px #c026d322, 0 10px 30px -20px #c026d366",
        v2sm: "0 1px 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)",
        v2md: "0 4px 6px rgba(0,0,0,0.15), 0 10px 24px rgba(0,0,0,0.2)",
        v2lg: "0 10px 25px rgba(0,0,0,0.2), 0 20px 48px rgba(0,0,0,0.25)",
        v2xl: "0 20px 40px rgba(0,0,0,0.25), 0 32px 64px rgba(0,0,0,0.3)",
        v2glow: "0 0 20px rgba(168, 85, 247, 0.35), 0 8px 35px rgba(236, 72, 153, 0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
