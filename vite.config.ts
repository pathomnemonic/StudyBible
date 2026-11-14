import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const brand = JSON.parse(readFileSync(new URL('./brand.json', import.meta.url), 'utf8')) as { name: string; description: string };
/** puts the app name from brand.json into index.html */
const brandHtml = () => ({ name: 'brand-html', transformIndexHtml: (html: string) => html.replace(/%BRAND_NAME%/g, brand.name).replace(/%BRAND_DESCRIPTION%/g, brand.description) });

// `base: './'` keeps the build relocatable (GitHub Pages sub-paths, file hosting, Capacitor wrappers).
export default defineConfig({
  base: './',
  define: { __APP_BUILD__: JSON.stringify(`${process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'local'} ${new Date().toISOString().slice(0, 10)}`) },
  plugins: [
    react(),
    brandHtml(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: brand.name,
        short_name: brand.name,
        description: brand.description,
        id: 'org.cathology.app',
        lang: 'en',
        dir: 'ltr',
        scope: './',
        theme_color: '#0a0c1c',
        background_color: '#0a0c1c',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        categories: ['education', 'books', 'lifestyle'],
        start_url: './?source=pwa',
        prefer_related_applications: false,
        shortcuts: [
          { name: 'Today', short_name: 'Today', url: './#/today' },
          { name: 'Memorize', short_name: 'Memorize', url: './#/memorize' },
          { name: 'Verse widget', short_name: 'Widget', url: './#/widget/verse' },
          { name: 'Crown Quest trivia', short_name: 'Trivia', url: './#/play/trivia' },
        ],
        // Windows 11 widgets board (Microsoft Edge): the verse of the day, fed by public/widgets-sw.js
        ...({ widgets: [{ name: 'Verse of the day', tag: 'verse', description: 'Today\u2019s verse, from the Bible in your app.', ms_ac_template: 'widgets/verse-template.json', data: 'widgets/verse-data.json', type: 'application/json', auth: false, update: 86400, icons: [{ src: 'icon-192.png', sizes: '192x192' }] }] } as Record<string, unknown>),
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        importScripts: ['widgets-sw.js'],
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
  // the data checks read hundreds of files; under a busy machine they passed alone but timed out at the default 5 s / 15 s
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 60000, hookTimeout: 60000 },
});
