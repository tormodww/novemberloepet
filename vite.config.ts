import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/novemberlopet/' : './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        start: 'start.html',
        slutt: 'slutt.html',
        admin: 'admin.html'
      },
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash][extname]`
      }
    }
  }
})
