import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,      // Listen on all addresses, including LAN and Docker container
    port: 3000,      // strict port
    strictPort: true,
    watch: {
      usePolling: true, // Fixes hot reload issues in Docker
    }
  }
})
