import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-brand-assets',
      writeBundle() {
        // Copy brand assets to dist after build
        const brandAssets = [
          'assets/icon/dark/leger-icon-dark.svg',
          'assets/icon/light/leger-icon-light.svg',
          'assets/logotype/dark/leger-logo-dark.svg',
          'assets/logotype/light/leger-logo-light.svg',
        ]
        
        brandAssets.forEach(asset => {
          const src = path.resolve(__dirname, 'brand', asset)
          const dest = path.resolve(__dirname, 'dist/brand', asset)
          mkdirSync(path.dirname(dest), { recursive: true })
          copyFileSync(src, dest)
        })
        
        console.log('✅ Copied brand assets to dist/')
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@brand": path.resolve(__dirname, "./brand"),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-select', 
                '@radix-ui/react-tabs', '@radix-ui/react-label', '@radix-ui/react-slot', 
                '@radix-ui/react-switch', '@radix-ui/react-checkbox', '@radix-ui/react-toast',
                '@radix-ui/react-dropdown-menu', '@radix-ui/react-avatar', '@radix-ui/react-tooltip',
                '@radix-ui/react-popover', '@radix-ui/react-separator', '@radix-ui/react-alert-dialog'],
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react']
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    reportCompressedSize: true,
    cssMinify: true,
  },
  
  server: {
    port: 3000,
    host: true,
    open: false,
    cors: true
  },
  
  preview: {
    port: 3001,
    host: true,
    cors: true
  },
  
  esbuild: {
    legalComments: 'none',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@cloudflare/workers-types']
  }
})
