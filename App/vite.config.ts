import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Relative base so the built bundle also loads inside the Capacitor WebView.
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
})
