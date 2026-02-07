import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  // Use environment variable for base path, defaults to '/' for custom domain deployments
  // Set VITE_BASE_PATH=/aluminum-website/ for GitHub Pages deployments
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: '/index.html',
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    // Enable SPA fallback for client-side routing
    middlewareMode: false,
    // This is critical for SPA routing - all routes fall back to index.html
    historyApiFallback: true,
  },
  preview: {
    port: 4173,
    // Also enable for preview mode
    historyApiFallback: true,
  },
})
