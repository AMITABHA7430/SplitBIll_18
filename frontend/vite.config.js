import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config – serves on 0.0.0.0:3000 so supervisor/ingress can reach it.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // Allow the emergentagent preview domain + localhost
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
