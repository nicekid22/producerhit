import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          ui: ["zustand", "react-hot-toast"],
        },
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: ["react-dev-locator"],
      },
    }),
    tsconfigPaths(),
  ],
});
