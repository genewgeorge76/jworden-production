import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
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
          if (id.includes('mapbox-gl')) {
            return 'vendor-mapbox'
          }
          if (id.includes('recharts')) {
            return 'vendor-charts'
          }
          if (id.includes('@react-three')) {
            return 'vendor-three'
          }
          if (id.includes('@radix-ui')) {
            return 'vendor-radix'
          }
        }
      }
    }
  }
})
