import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
            return "vendor";
          }
          if (id.includes("node_modules/@supabase/supabase-js")) return "supabase";
          if (id.includes("node_modules/zustand") || id.includes("node_modules/react-hot-toast")) return "ui";
          if (id.includes("/src/lib/audioApi") || id.includes("/src/lib/promptBuilder")) return "audio";
        },
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: mode === "development" ? ["react-dev-locator"] : [],
      },
    }),
    tsconfigPaths(),
  ],
}));
