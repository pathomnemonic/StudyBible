import { defineConfig } from 'vitest/config';
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
        shortcuts: [
          { name: 'Today', short_name: 'Today', url: './#/today' },
          { name: 'Memorize', short_name: 'Memorize', url: './#/memorize' },
          { name: 'Verse widget', short_name: 'Widget', url: './#/widget' },
        ],
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // App shell is precached; Scripture and content packs are cached the first time they are read
        // (or on demand through Settings → Offline), never fetched eagerly.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // the 3D galaxy (three.js) and the map are large and used occasionally: cached the first time they are opened
        globIgnores: ['**/assets/scene-*.js', '**/assets/leaflet-*.js'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/(scene|leaflet)-.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'studybible-heavy-v1' },
          },
          {
            // network first (a fast check; the browser answers 304 for unchanged files), cached copy when offline or slow:
            // a corrected data file reaches people who already have an older one cached
            urlPattern: ({ url }) => url.pathname.includes('/data/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'studybible-data-v1', networkTimeoutSeconds: 4, expiration: { maxEntries: 6000 } },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
