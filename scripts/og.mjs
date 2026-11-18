/**
 * Draws the pictures that chat apps show when a link is shared (public/og/*.jpg, 1200x630): the 3D basilica with a title on it.
 * Run `npm run build && npx vite preview --port 4182` first, then `node scripts/og.mjs`. Needs Playwright with Chromium. Regenerate it when the scene changes.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4182';
const OUT = new URL('../public/og/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
await page.addInitScript(() => { try { localStorage.setItem('cathology.bas3d', 'force'); } catch { /* none */ } });
await page.goto(`${BASE}/#/play/deepwaters`);
await page.waitForSelector('.dw-begin'); await page.waitForTimeout(6000);
const card = (title, sub) => page.evaluate(([t, s]) => {
  document.getElementById('og-x')?.remove();
  const st = document.createElement('style'); st.id = 'og-x';
  st.textContent = '.shell,.arc-sound,.game-help,.deep-waters{visibility:hidden!important}';
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'og-x2';
  d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 0 0 70px;background:linear-gradient(90deg,rgba(24,14,40,.82) 0%,rgba(24,14,40,.55) 46%,rgba(24,14,40,0) 72%);color:#fff7e0;font-family:"Cormorant Garamond",Georgia,serif;text-shadow:0 2px 18px rgba(0,0,0,.55)';
  d.innerHTML = `<div style="font-size:26px;letter-spacing:.32em;text-transform:uppercase;color:#f1cf6b">Cathology</div><div style="font-size:132px;line-height:1;font-weight:600;margin:10px 0 18px">${t}</div><div style="font-size:38px;max-width:560px;line-height:1.25;color:#fff0cf">${s}</div>`;
  document.getElementById('og-x2')?.remove(); document.body.appendChild(d);
}, [title, sub]);
for (const [file, title, sub] of [['basilion', 'Basilion', 'Climb the basilica one answer at a time. A daily Catholic word game.'], ['default', 'Cathology', 'Read, study, pray and learn the Catholic faith.']]) {
  await card(title, sub); await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}${file}.jpg`, type: 'jpeg', quality: 78 });
  console.log(file, fs.statSync(`${OUT}${file}.jpg`).size);
}
await browser.close();
