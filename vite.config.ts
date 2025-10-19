import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/novemberloepet/', // viktig for GitHub Pages
  build: {
    outDir: 'dist',
  },
  server: {
    fs: {
      strict: false,
    }
  }
})
