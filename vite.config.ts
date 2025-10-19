import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Automatisk base-path for både dev og prod
const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/novemberloepet/' : '/';

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
