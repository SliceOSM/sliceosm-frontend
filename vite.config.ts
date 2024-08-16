import { defineConfig } from 'vite'
import { resolve } from "path";
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        create: resolve(__dirname, "index.html"),
        show: resolve(__dirname, "show/index.html"),
      },
    },
  },
})
