// Renders every icon and store graphic from public/icon.svg, and screenshots from the running app.
// Usage: npm run build && npx vite preview --port 4173 &   then   node scripts/launch/make-assets.mjs
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4173';
const svg = readFileSync('public/icon.svg', 'utf8');
const BG = '#0a0c1c';
const b = await chromium.launch();
const dir = (d) => mkdirSync(d, { recursive: true });
['store/android/res', 'store/android/play', 'store/ios/AppIcon', 'store/ios/screenshots', 'store/android/screenshots'].forEach(dir);

async function render(html, w, h, out, transparent = false) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:${transparent ? 'transparent' : BG}">${html}</body></html>`);
  await p.screenshot({ path: out, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  await p.close();
}
const mark = (size, pad = 0, rounded = true) => {
  // the cross on its own (for adaptive/maskable foregrounds) or the full tile
  const inner = svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
  return `<div style="width:${size}px;height:${size}px;padding:${pad}px;box-sizing:border-box">${inner.replace('viewBox', 'style="display:block" viewBox')}</div>`;
};
// full tile icons (rounded as designed)
for (const s of [48, 72, 96, 144, 192, 512]) await render(mark(s), s, s, s === 512 ? 'public/icon-512.png' : s === 192 ? 'public/icon-192.png' : `store/android/res/ic_launcher_${s}.png`, true);
await render(mark(192), 192, 192, 'store/android/res/ic_launcher_192.png', true);
// maskable: full-bleed square, cross inside the 80% safe zone
const bleed = (s, scale) => `<div style="width:${s}px;height:${s}px;background:linear-gradient(135deg,#143c2f,#0a0c1c);display:flex;align-items:center;justify-content:center"><div style="width:${s * scale}px;height:${s * scale}px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="212 212 600 600" width="${s * scale}" height="${s * scale}"><rect x="456" y="212" width="112" height="600" rx="56" fill="#9be3b4"/><rect x="262" y="372" width="500" height="112" rx="56" fill="#9be3b4"/></svg></div></div>`;
await render(bleed(512, 0.56), 512, 512, 'public/icon-maskable-512.png');
await render(bleed(512, 0.56), 512, 512, 'store/android/play/maskable-512.png');
await render(bleed(180, 0.62), 180, 180, 'public/apple-touch-icon.png');
await render(bleed(1024, 0.62), 1024, 1024, 'store/ios/AppIcon/AppIcon-1024.png');     // opaque, no alpha: App Store requirement
await render(bleed(512, 0.62), 512, 512, 'store/android/play/play-store-icon-512.png');
// Android adaptive icon layers (108dp @ xxxhdpi = 432px; keep the cross inside the central 66%)
await render(`<div style="width:432px;height:432px;display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="212 212 600 600" width="240" height="240"><rect x="456" y="212" width="112" height="600" rx="56" fill="#9be3b4"/><rect x="262" y="372" width="500" height="112" rx="56" fill="#9be3b4"/></svg></div>`, 432, 432, 'store/android/res/ic_launcher_foreground_432.png', true);
await render(`<div style="width:432px;height:432px;background:linear-gradient(135deg,#143c2f,#0a0c1c)"></div>`, 432, 432, 'store/android/res/ic_launcher_background_432.png');
// iOS icon sizes (px)
for (const s of [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180]) await render(bleed(s, 0.62), s, s, `store/ios/AppIcon/AppIcon-${s}.png`);
// Play feature graphic 1024x500
await render(`<div style="width:1024px;height:500px;background:radial-gradient(ellipse at 20% 30%,#1d5a45 0,#0a0c1c 70%);display:flex;align-items:center;gap:48px;padding:0 90px;box-sizing:border-box;font-family:Georgia,serif;color:#ecebf8"><div style="width:220px;height:220px">${svg.replace('<svg ', '<svg width="220" height="220" ')}</div><div><div style="font-size:84px;letter-spacing:1px">Cathology</div><div style="font-size:30px;color:#b8e8cb;margin-top:14px;font-family:system-ui,sans-serif">Read, study, pray and learn the Catholic faith</div></div></div>`, 1024, 500, 'store/android/play/feature-graphic-1024x500.png');
// iOS/Android launch splash (portrait 2732 square-safe)
await render(`<div style="width:2732px;height:2732px;background:linear-gradient(135deg,#143c2f,#0a0c1c);display:flex;align-items:center;justify-content:center"><div style="width:520px;height:520px">${svg.replace('<svg ', '<svg width="520" height="520" ')}</div></div>`, 2732, 2732, 'store/splash-2732.png');

// ---- screenshots of the real app
const SHOTS = [
  ['today', '#/today'],
  ['read', '#/read/webc/JHN/3'],
  ['learn', '#/learn'],
  ['game', '#/play/verbum'],
  ['saints', '#/study/saint-names'],
  ['pray', '#/pray'],
];
const DEVICES = [
  ['android/screenshots/phone', 360, 640, 3],
  ['android/screenshots/tablet10', 800, 1280, 2],
  ['ios/screenshots/iphone-6.7', 430, 932, 3],
  ['ios/screenshots/iphone-6.5', 414, 896, 3],
  ['ios/screenshots/ipad-12.9', 1024, 1366, 2],
];
for (const [name, w, h, dsf] of DEVICES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, hasTouch: true, isMobile: w < 700 });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  for (const [slug, hash] of SHOTS) {
    await p.goto(`${BASE}/${hash}`); await p.waitForTimeout(1800);
    for (const t of ['Got it', 'Skip', 'Not now']) { const el = p.getByRole('button', { name: t }).first(); if (await el.count()) await el.click().catch(() => {}); }
    await p.waitForTimeout(300);
    await p.screenshot({ path: `store/${name}-${slug}.png` });
  }
  await ctx.close();
}
await b.close();
console.log('assets written');
