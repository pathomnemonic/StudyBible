import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { previewTags, sharePageHtml } from './scripts/sharePages';
import { SHARE_GAMES } from './src/lib/shareGames';

const brand = JSON.parse(readFileSync(new URL('./brand.json', import.meta.url), 'utf8')) as { name: string; tagline: string; description: string };
/** puts the app name from brand.json into index.html */
const brandHtml = () => ({ name: 'brand-html', transformIndexHtml: (html: string) => html.replace(/%BRAND_NAME%/g, brand.name).replace(/%BRAND_DESCRIPTION%/g, brand.description) });

/**
 * Link previews. WhatsApp and other message apps read the Open Graph tags of the page behind a link, and they need an absolute address for the picture, so the
 * public address of the site comes from VITE_SITE_URL (set by the Pages workflow) and is used for the front page and for one small page per shared game
 * (share/<game>.html, which then opens the game). Without it the tags still exist but point at relative addresses and a message app will ignore the picture.
 */
const siteUrl = (process.env.VITE_SITE_URL || '').replace(/\/?$/, '/').replace(/^\/$/, '');
const abs = (p: string) => (siteUrl ? siteUrl + p : './' + p);
const linkPreview = () => ({
  name: 'link-preview',
  transformIndexHtml: (html: string) => html.replace('<!--OG_TAGS-->', previewTags({ siteName: brand.name, title: `${brand.name}: ${brand.tagline}`, description: brand.description, url: siteUrl || './', image: abs('og/default.jpg') })),
  generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) {
    for (const game of SHARE_GAMES) this.emitFile({ type: 'asset', fileName: `share/${game.slug}.html`, source: sharePageHtml({ siteUrl, siteName: brand.name, game }) });
  },
});

// `base: './'` keeps the build relocatable (GitHub Pages sub-paths, file hosting, Capacitor wrappers).
export default defineConfig({
  base: './',
  define: { __APP_BUILD__: JSON.stringify(`${process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'local'} ${new Date().toISOString().slice(0, 10)}`) },
  plugins: [
    react(),
    brandHtml(),
    linkPreview(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: brand.name,
        short_name: brand.name,
        description: brand.description,
        id: 'com.pathomnemonic.cathology',
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
        // the games' 3D icons (about 0.6 MB) are part of the shell so the games look right offline
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'arcade/3d/*.webp'],
        // the 3D galaxy (three.js) and the map are large and used occasionally: cached the first time they are opened
        globIgnores: ['**/assets/scene-*.js', '**/assets/leaflet-*.js', 'share/**'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/share\//], // the link-preview pages are real pages, not the app
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/(scene|leaflet)-.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'studybible-heavy-v1' },
          },
          {
            // the animated emoji are larger and only appear at moments of celebration: cached the first time they are shown
            urlPattern: ({ url }) => url.pathname.includes('/arcade/anim/'),
            handler: 'CacheFirst',
            options: { cacheName: 'studybible-arcade-v1', expiration: { maxEntries: 80 } },
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
