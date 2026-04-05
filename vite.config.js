import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  publicDir: 'public',
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      
    },
  },
})