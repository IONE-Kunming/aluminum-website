import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Custom plugin to copy CSV file to dist folder
    {
      name: 'copy-csv',
      closeBundle() {
        try {
          mkdirSync('dist', { recursive: true })
          copyFileSync(
            resolve(__dirname, 'public/sample-products-import.csv'),
            resolve(__dirname, 'dist/sample-products-import.csv')
          )
          console.log('✓ Copied sample-products-import.csv to dist/')
        } catch (err) {
          console.error('Failed to copy CSV file:', err)
        }
      }
    }
  ],
  // Use environment variable for base path, defaults to '/' for custom domain deployments
  // Set VITE_BASE_PATH=/aluminum-website/ for GitHub Pages deployments
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Don't generate source maps in production for security
    sourcemap: false,
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
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        toplevel: true, // Mangle top-level variable names for obfuscation
      },
      format: {
        comments: false, // Remove all comments
      }
    },
  },
  server: {
    host: true,
    port: 5173,
    // Enable SPA fallback for client-side routing
    middlewareMode: false,
    // This is critical for SPA routing - all routes fall back to index.html
    historyApiFallback: true,
    // Add security headers for development server
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
    }
  },
  preview: {
    port: 4173,
    // Also enable for preview mode
    historyApiFallback: true,
  },
})
