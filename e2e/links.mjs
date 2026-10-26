// Follows every internal link found on the main pages and reports pages that error, show a not-found message, or are empty.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const seeds = ['today', 'pray', 'pray/devotions', 'listen', 'learn', 'library', 'you', 'study', 'read', 'study/curriculum', 'study/curriculum/YA', 'study/ya', 'pray/plans', 'everything', 'teach'];
const queue = seeds.map((s) => `/#/${s}`); const seen = new Set(); const bad = [];
const cap = Number(process.env.CAP || 400);
while (queue.length && seen.size < cap) {
  const path = queue.shift(); if (seen.has(path)) continue; seen.add(path);
  errs.length = 0;
  await p.goto(BASE + path); await p.waitForTimeout(450);
  const r = await p.evaluate(() => ({ t: document.body.innerText.slice(0, 4000), len: document.querySelector('main, #root')?.innerText.length ?? 0, h: [...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href')) }));
  if (errs.length) bad.push(`${path}: ${errs[0]}`);
  else if (/something went wrong|page not found|\bundefined\b|\[object Object\]|\bNaN\b/.test(r.t.replace(/Nothing found/i, ''))) bad.push(`${path}: suspicious text "${(r.t.match(/something went wrong|page not found|\bundefined\b|\[object Object\]|\bNaN\b/) || [''])[0]}"`);
  else if (r.len < 60) bad.push(`${path}: nearly empty`);
  for (const h of r.h) { const u = '/' + h; const key = u.replace(/\?.*$/, ''); if (!seen.has(u) && !queue.includes(u) && !/\/read\/[a-z]+\/[A-Z0-9]+\/\d+/.test(key) && queue.length < 3000) queue.push(u); }
}
await b.close();
console.log('visited', seen.size);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('links ok');
