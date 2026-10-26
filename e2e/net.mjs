// Every request a page makes should succeed: no 404s for data, images or audio hosted by the app.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const bad = new Set();
p.on('response', (r) => { const u = r.url(); if (u.startsWith(BASE) && r.status() >= 400) bad.add(`${r.status()} ${u.replace(BASE, '')}`); });
p.on('requestfailed', (r) => { const u = r.url(); if (u.startsWith(BASE)) bad.add(`failed ${u.replace(BASE, '')}`); });
const routes = ['today', 'read/webc/GEN/1', 'read/webc/PSA/23', 'read/webc/WIS/9', 'read/webc/LUK/2', 'read/dra/MAT/5', 'listen', 'listen?tab=meditate', 'listen?tab=videos', 'listen?tab=audiobooks', 'pray', 'pray/sleep', 'pray/devotions/rosary?set=joyful', 'pray/plans', 'learn', 'study/curriculum/YA', 'study/curriculum/YA/YA-13-1', 'study/curriculum/5', 'library', 'you', 'study/saints', 'share', 'study/maps', 'study/kids'];
for (const r of routes) { await p.goto(`${BASE}/#/${r}`); await p.waitForTimeout(1800); }
await b.close();
if (bad.size) { console.error([...bad].join('\n')); process.exit(1); }
console.log('net ok');
