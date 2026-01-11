import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'ef.jpg'],
      manifest: {
        name: 'EF Bets',
        short_name: 'EF Bets',
        description: 'EF Bets - Your betting companion',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'ef.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'ef.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: 'ef.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']
      }
    })
  ]
})
