import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages project site: https://procterconsult01-hub.github.io/locate-ng/
export default defineConfig({
  plugins: [react()],
  base: '/locate-ng/',
})
