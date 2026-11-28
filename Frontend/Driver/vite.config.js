import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the app calls /api on its own origin and Vite forwards it.
const proxy = { '/api': process.env.API_PROXY ?? 'http://localhost:5000' }

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy },
  preview: { port: 4174, proxy },
})
