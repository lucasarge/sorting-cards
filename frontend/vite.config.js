import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    minify: false,
    rollupOptions: {
      input: {
        main: './index.html',
        motivation: './motivation.html',
        strength: './strength.html'
      }
    }
  }
})
