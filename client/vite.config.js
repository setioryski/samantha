// client/vite.config.js
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'], // Added font files just in case
        runtimeCaching: [ // <-- Add this section
          {
            // Match GET requests to your API routes (adjust the pattern if needed)
            urlPattern: ({ request, url }) =>
              request.method === 'GET' && url.pathname.startsWith('/api/'),
            // Use NetworkFirst strategy: try network, fallback to cache
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache', // Name for this cache storage
              expiration: {
                maxEntries: 100, // Maximum number of entries in this cache
                maxAgeSeconds: 60 * 60 * 24 * 7 // Cache for a maximum of 7 days
              },
              cacheableResponse: {
                statuses: [0, 200] // Cache successful responses and opaque responses (for CORS)
              }
            }
          },
          // You could add other strategies here for different routes or methods if needed
        ]
      },
      manifest: {
        name: 'Samantha Hot Spa', // Updated Name
        short_name: 'Samantha Spa', // Updated Short Name
        description: 'Samantha Hot Spa POS System',
        theme_color: '#0284c7',
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
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
        screenshots: [
          {
            src: '/screenshot-desktop.png', // Make sure these exist in /client/public
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop POS View'
          },
          {
            src: '/screenshot-mobile.png', // Make sure these exist in /client/public
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
        target: 'http://localhost:5001', // Your backend server address
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: ['xlsx', 'file-saver'],
  },
})