import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Custom domain (apex): https://locate-ng.com/ — base must be '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
})
