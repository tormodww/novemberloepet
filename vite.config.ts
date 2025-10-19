import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = process.env.VITE_BASE || '/novemberloepet/';

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
  },
  server: {
    fs: {
      strict: false,
    }
  }
})
