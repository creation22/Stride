import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      writeBundle() {
        // Ensure dist directory exists
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        
        // Copy manifest.json
        copyFileSync('manifest.json', 'dist/manifest.json')
        
        // Copy background script
        copyFileSync('src/background/background.js', 'dist/background.js')
        
        // Copy icons directory if it exists
        if (existsSync('icons')) {
          if (!existsSync('dist/icons')) {
            mkdirSync('dist/icons', { recursive: true })
          }
          // Copy icon files (you'll need to add actual icon files)
          try {
            copyFileSync('icons/icon16.png', 'dist/icons/icon16.png')
            copyFileSync('icons/icon48.png', 'dist/icons/icon48.png')
            copyFileSync('icons/icon128.png', 'dist/icons/icon128.png')
          } catch (error) {
            console.warn('Icon files not found. Please add icon files to the icons directory.')
          }
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
    },
  },
})