import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to fix script attributes in built HTML for Domo compatibility.
// Vite adds type="module" or defer by default — both break in Domo's CDN
// which serves .js as application/octet-stream.
function domoScriptFix() {
  return {
    name: 'domo-script-fix',
    enforce: 'post' as const,
    transformIndexHtml(html: string) {
      return html
        .replace(/ type="module"/g, '')
        .replace(/ crossorigin/g, '')
        .replace(/<script defer /g, '<script ');
    },
  };
}

// Vite config for Domo Pro-Code React app
// IMPORTANT: Domo CDN serves .js as application/octet-stream, which breaks
// ESM type="module" scripts. Build as IIFE to avoid MIME type rejection.
// Output to root (not dist/) so manifest.json, index.html, and assets/ are siblings.
export default defineConfig({
  plugins: [react(), domoScriptFix()],
  base: './', // Relative paths for Domo's iframe context
  build: {
    outDir: '.',
    emptyOutDir: false, // Don't delete source files when building to root
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // IIFE format — Domo CDN MIME type incompatible with ESM modules
        format: 'iife',
        manualChunks: undefined,
        // Single output file for simplicity
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
