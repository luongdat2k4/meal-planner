import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Absolute base: assets must resolve from nested routes like /meals/:id.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
