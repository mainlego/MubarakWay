import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 10000,
    host: '0.0.0.0',
    // Fallback to index.html for SPA routing
    strictPort: true,
  },
  server: {
    // For development server
    historyApiFallback: true,
  },
  build: {
    // Ensure proper SPA routing in production
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep original extension for assets
          const extType = assetInfo.name.split('.').pop();
          return `assets/[name]-[hash].${extType}`;
        },
        manualChunks: undefined,
      },
    },
    // Generate source maps for better debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
})
