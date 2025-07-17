import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Allow LAN access
    https: (() => {
      try {
        // 証明書ファイルが存在すればHTTPSを有効化
        const keyPath = resolve(__dirname, 'server.key')
        const certPath = resolve(__dirname, 'server.crt')
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
          }
        }
      } catch (error) {
        console.log('HTTPS certificates not found, using HTTP')
      }
      return false
    })(),
    // Proxy backend API to avoid Mixed Content issues
    proxy: {
      '/api': {
        target: (() => {
          // Check if backend SSL certificates exist
          try {
            const backendKeyPath = resolve(__dirname, '../backend/server.key')
            const backendCertPath = resolve(__dirname, '../backend/server.crt')
            if (fs.existsSync(backendKeyPath) && fs.existsSync(backendCertPath)) {
              return 'https://localhost:3001'
            }
          } catch (error) {
            console.log('Backend SSL certificates not found, using HTTP')
          }
          return 'http://localhost:3001'
        })(),
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url, 'to', options.target)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url)
          })
        }
      }
    },
    // Optimized headers for LAN-only environment
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN', // Allow same-origin framing for LAN
      'Referrer-Policy': 'no-referrer-when-downgrade', // Relaxed for LAN
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