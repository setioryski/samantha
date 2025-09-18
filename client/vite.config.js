import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/' + '*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: '',
        short_name: 'Samantha Hot Spa',
        description: 'Samantha Hot Spa POS System',
        theme_color: '#0284c7',
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/", // <-- Corrected and explicitly set
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        // Add this section to fix the screenshot warnings
        screenshots: [
          {
            src: '/screenshot-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop POS View'
          },
          {
            src: '/screenshot-mobile.png',
            sizes: '540x720',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile POS View'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['xlsx', 'file-saver'],
  },
})