// A folded section either opens for good or never shows open: it must not flash open and then close while the page works out what fits.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const bad = [];
for (const [w, h] of [[360, 740], [390, 844], [412, 915]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  for (const r of ['learn', 'pray', 'room', 'profile', 'listen']) {
    const p = await ctx.newPage();
    await p.goto(`${BASE}/#/${r}`);
    await p.evaluate(() => {
      window.__frames = [];
      const t0 = performance.now();
      const tick = () => { window.__n = window.__n || 0; window.__frames.push([...document.querySelectorAll('details.fold')].map((d) => { d.__id ??= ++window.__n; return [d.__id, d.open]; })); if (performance.now() - t0 < 2500) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    await p.waitForTimeout(2800);
    const frames = await p.evaluate(() => window.__frames);
    await p.close();
    const byId = new Map();
    for (const f of frames) for (const [id, open] of f) byId.set(id, [...(byId.get(id) ?? []), open]);
    for (const [id, col] of byId) { const firstOpen = col.indexOf(true); if (firstOpen >= 0 && col.slice(firstOpen).includes(false)) bad.push(`${w}x${h} #/${r}: a fold opened and then closed`); }
    // the number of open folds never goes down on its own (a rebuilt fold that comes back closed looks the same as one that closed)
    for (let i = 1; i < frames.length; i++) if (frames[i].filter(([, o]) => o).length < frames[i - 1].filter(([, o]) => o).length) { bad.push(`${w}x${h} #/${r}: an open fold went away`); break; }
  }
  await ctx.close();
}
await b.close();
if (bad.length) { console.error([...new Set(bad)].join('\n')); process.exit(1); }
console.log('fold flicker e2e ok');
