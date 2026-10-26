// Layout audit on phones: nothing scrolls sideways, and no heading, button or link has its text cut off.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const src = readFileSync(new URL('./smoke.mjs', import.meta.url), 'utf8');
const ROUTES = eval(/const ROUTES = (\[[\s\S]*?\]);/.exec(src)[1]);
const WIDTHS = (process.env.WIDTHS ?? '320,390').split(',').map(Number);
const b = await chromium.launch();
const problems = [];
for (const w of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage();
  for (const r of ROUTES) {
    await p.goto(`${BASE}/#${r}`).catch(() => {});
    await p.waitForTimeout(500);
    const bad = await p.evaluate(() => {
      const out = [];
      const se = document.scrollingElement;
      if (se && se.scrollWidth - se.clientWidth > 1) out.push(`sideways scroll of ${se.scrollWidth - se.clientWidth}px`);
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const scrollX = (e) => { for (let a = e.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if ((o === 'auto' || o === 'scroll') && a.scrollWidth > a.clientWidth) return true; } return false; };
      for (const e of document.querySelectorAll('h1, h2, h3, button, a, summary, label, .chip, .title-btn, .hub-tile-t')) {
        if (!vis(e) || scrollX(e) || e.closest('.tabs, .tabbar, .chips, .chip-scroll, .tour-card, [data-clip-ok]')) continue;
        const cs = getComputedStyle(e);
        const clipped = (cs.overflow === 'hidden' || cs.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 2 && cs.display !== 'inline';
        const lineCut = cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== '' && e.scrollHeight > e.clientHeight + 3 && /^(H1|H2|H3)$/.test(e.tagName);
        const ell = cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 2;
        if (clipped || ell || lineCut) out.push(`text cut off: "${(e.textContent || '').trim().slice(0, 50)}" (${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]})`);
      }
      return [...new Set(out)];
    });
    for (const m of bad) problems.push(`${w}px ${r}: ${m}`);
  }
  await ctx.close();
}
await b.close();
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`layout ok on ${ROUTES.length} routes at ${WIDTHS.join(' and ')}px`);
