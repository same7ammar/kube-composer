import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Root path for custom domain
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      '.manus-asia.computer',
      '5173-i0h1gv67smt7w6iyos7kj-5563ba97.manus-asia.computer',
      'localhost',
      '.localhost'
    ]
  },
  preview: {
    port: 8080,
    host: true,
    strictPort: false
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})