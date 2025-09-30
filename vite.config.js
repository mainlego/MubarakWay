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
        manualChunks: undefined,
      },
    },
  },
})
