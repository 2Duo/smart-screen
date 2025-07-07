import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Security headers for development
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    outDir: 'dist',
    // Disable source maps in production for security
    sourcemap: mode === 'development',
    // Additional security and optimization settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        // Obfuscate chunk names in production
        chunkFileNames: mode === 'production' 
          ? 'assets/[hash].js' 
          : 'assets/[name]-[hash].js',
        entryFileNames: mode === 'production' 
          ? 'assets/[hash].js' 
          : 'assets/[name]-[hash].js',
        assetFileNames: mode === 'production' 
          ? 'assets/[hash].[ext]' 
          : 'assets/[name]-[hash].[ext]',
      },
    },
  },
  // Environment variables security
  define: {
    // Only expose specific environment variables to the client
    __DEV__: mode === 'development',
    __PROD__: mode === 'production',
  },
  // Additional security configurations
  esbuild: {
    // Remove all console logs and debugger statements in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))