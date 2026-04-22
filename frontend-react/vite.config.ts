import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/extrait-naissance': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/extrait-deces': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/extrait-mariage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/attestation-residence': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
