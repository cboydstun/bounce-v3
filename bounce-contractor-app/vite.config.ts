/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), legacy()],
  build: {
    // Remove all manual chunking to eliminate circular dependency issues
    // Let Vite handle chunking automatically to prevent crashes
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Disable in production
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@ionic/react",
      "zustand",
      "@tanstack/react-query",
    ],
    exclude: ["@capacitor/camera", "@capacitor/geolocation"], // Native plugins
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
