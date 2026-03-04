import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // CRITICAL: './' ensures assets use relative paths so file:// works in Electron
  base: './',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Monaco editor core — largest chunk, cached separately
          if (id.includes('node_modules/monaco-editor')) {
            return 'monaco-core';
          }
          // Terminal
          if (id.includes('node_modules/@xterm')) {
            return 'xterm';
          }
          // Charts + UI command palette
          if (id.includes('node_modules/recharts') || id.includes('node_modules/cmdk')) {
            return 'ui-vendor';
          }
          // Let Vite handle React deduplication naturally
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
