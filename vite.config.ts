import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

// Tauri serves static files, so TanStack Start runs in SPA mode and the shell
// is prerendered as index.html.
export default defineConfig({
  clearScreen: false,
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          outputPath: "/index",
        },
      },
    }),
    viteReact(),
    // Icons as React components, compiled on demand: only the imported ones reach the bundle.
    // Codicons for the window chrome, Lucide for content. Each icon gets a class per set
    // (`icon icon--codicon` / `icon icon--lucide`), so CSS can style each set.
    Icons({
      compiler: "jsx",
      jsx: "react",
      iconCustomizer(collection, _icon, props) {
        props.class = `icon icon--${collection}`;
      },
    }),
  ],
});
