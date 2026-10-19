import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// `base: './'` keeps the build relocatable (GitHub Pages sub-paths, file hosting, Capacitor wrappers).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Study Bible',
        short_name: 'Study Bible',
        description: 'A Catholic Bible study library: Scripture, Church teaching, the Fathers, notes and prayer.',
        theme_color: '#7a2e2e',
        background_color: '#fbf8f3',
        display: 'standalone',
        start_url: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // App shell is precached; Scripture and content packs are cached the first time they are read
        // (or on demand through Settings → Offline), never fetched eagerly.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/'),
            handler: 'CacheFirst',
            options: { cacheName: 'studybible-data-v1', expiration: { maxEntries: 2000 } },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
