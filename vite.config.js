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
        const distDir = 'dist'
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true })
        }
        
        // Copy manifest.json from public folder (usually manifest.json is in public/)
        const manifestSrc = 'public/manifest.json'
        const manifestDest = `${distDir}/manifest.json`
        if (existsSync(manifestSrc)) {
          copyFileSync(manifestSrc, manifestDest)
        } else {
          console.warn('manifest.json not found in public folder')
        }
        
        // Copy background script
        const bgSrc = 'src/background/background.js'
        const bgDest = `${distDir}/background.js`
        if (existsSync(bgSrc)) {
          copyFileSync(bgSrc, bgDest)
        } else {
          console.warn('background.js not found in src/background')
        }
        
        // Copy icons folder and files
        const iconsSrcDir = 'public/icons'
        const iconsDestDir = `${distDir}/icons`
        if (existsSync(iconsSrcDir)) {
          if (!existsSync(iconsDestDir)) {
            mkdirSync(iconsDestDir, { recursive: true })
          }
          const icons = ['icon16.png', 'icon48.png', 'icon128.png']
          icons.forEach(iconFile => {
            const src = `${iconsSrcDir}/${iconFile}`
            const dest = `${iconsDestDir}/${iconFile}`
            if (existsSync(src)) {
              copyFileSync(src, dest)
            } else {
              console.warn(`Icon file ${iconFile} not found in ${iconsSrcDir}`)
            }
          })
        } else {
          console.warn('Icons directory not found in public')
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
