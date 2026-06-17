import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    target: "es2022",
    sourcemap: "hidden",
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            if (id.includes("/src/content/blog")) return "blog";
            if (id.includes("/src/generated/seoPages")) return "seo-pages";
            if (id.includes("/src/generated/seoComparisons")) return "seo-comparisons";
            if (id.includes("/src/i18n/")) return "i18n";
            if (id.includes("/src/lib/audioApi") || id.includes("/src/lib/promptBuilder")) return "audio";
            return undefined;
          }
          if (id.includes("node_modules/lucide-react")) return "icons";
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor";
          }
          if (id.includes("node_modules/@supabase/supabase-js")) return "supabase";
          if (id.includes("node_modules/zustand") || id.includes("node_modules/react-hot-toast")) return "ui";
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
