/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), legacy()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("@ionic/react")) {
              return "vendor-ionic";
            }
            if (
              id.includes("axios") ||
              id.includes("date-fns") ||
              id.includes("zustand")
            ) {
              return "vendor-utils";
            }
            if (id.includes("@capacitor")) {
              return "vendor-capacitor";
            }
            if (id.includes("firebase") || id.includes("socket.io")) {
              return "vendor-realtime";
            }
            if (id.includes("react-query") || id.includes("@tanstack")) {
              return "vendor-query";
            }
            // All other vendor dependencies
            return "vendor";
          }

          // Feature-based chunks for our code
          if (id.includes("/pages/auth/") || id.includes("/services/auth/")) {
            return "auth";
          }
          if (id.includes("/pages/tasks/") || id.includes("/hooks/tasks/")) {
            return "tasks";
          }
          if (id.includes("/pages/profile/")) {
            return "profile";
          }
          if (
            id.includes("/pages/notifications/") ||
            id.includes("/services/notifications/")
          ) {
            return "notifications";
          }
          if (id.includes("/pages/quickbooks/")) {
            return "quickbooks";
          }
          if (
            id.includes("/services/realtime/") ||
            id.includes("/store/realtimeStore")
          ) {
            return "realtime";
          }
        },
      },
    },
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
