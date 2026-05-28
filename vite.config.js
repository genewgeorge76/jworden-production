import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  logLevel: "error",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('react-helmet-async')) {
            return 'react-core'
          }
          if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'ui-core'
          }
          // Intentionally do NOT manualChunk three / @react-three packages.
          // Letting rollup split them naturally keeps the Vite preload helper
          // in the entry chunk so the homepage no longer pulls a 1MB three
          // chunk just to access __vitePreload(). three.js still ends up in
          // its own chunk because it's only reached via lazy() dynamic imports
          // from /visualizer, /floor-plan-studio, and the optional avatar.
        }
      }
    }
  }
})
