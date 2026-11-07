// PWA: manifest is served and valid, service worker registers, Install card shows, no console errors.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch(); const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/settings`); await p.waitForSelector('#install', { timeout: 6000 }).catch(() => fail('Install card missing'));
const m = await (await p.request.get(`${BASE}/manifest.webmanifest`)).json();
for (const k of ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'icons', 'categories']) if (!m[k]) fail('manifest lacks ' + k);
if (!m.icons.some((i) => i.purpose === 'maskable')) fail('no maskable icon');
for (const i of m.icons) { const r = await p.request.get(`${BASE}/${i.src}`); if (!r.ok()) fail('icon 404 ' + i.src); }
await p.waitForTimeout(1500);
const sw = await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
if (!sw) fail('service worker not registered');
if (!(await p.locator('#install').innerText()).match(/Install/)) fail('install text');
// offline reload still renders the app
await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
if ((await p.locator('body').innerText()).length < 50) fail('offline reload blank');
if (errs.length) fail(errs.join('; '));
console.log('ok pwa');
await b.close();
