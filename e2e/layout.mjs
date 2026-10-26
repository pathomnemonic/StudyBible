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
    await p.waitForTimeout(900);
    // open every menu and fold first: popups are where things run off the screen
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    await p.waitForTimeout(150);
    const bad = await p.evaluate(() => {
      const out = [];
      const se = document.scrollingElement;
      if (se && se.scrollWidth - se.clientWidth > 1) out.push(`sideways scroll of ${se.scrollWidth - se.clientWidth}px`);
      // the page clips sideways overflow, so look at the elements themselves: none may reach past the screen
      for (const e of document.querySelectorAll('.page *, .main > *')) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 || r.right <= innerWidth + 1) continue;
        let skip = false;
        for (let a = e; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || a.hasAttribute('data-clip-ok') || getComputedStyle(a).position === 'fixed') { skip = true; break; } }
        if (!skip) { out.push(`runs off the screen: ${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} (${Math.round(r.right)}px)`); break; }
      }
      // one card shape: every card in a grid has the same width, radius and padding, and card styles are only used inside a grid
      for (const g of document.querySelectorAll('.hub-tiles, .shelf')) {
        const kids = [...g.children].filter((k) => k.getBoundingClientRect().width > 0);
        const shapes = new Set(kids.map((k) => { const c = getComputedStyle(k), r = k.getBoundingClientRect(); return `${Math.round(r.width / 4)}|${c.borderRadius}|${c.paddingLeft}`; }));
        if (shapes.size > 1) out.push(`cards of different shapes in one grid: ${g.className} (${[...shapes].join(' vs ')})`);
      }
      for (const k of document.querySelectorAll('.hub-tile, .shelf-card')) if (!k.parentElement.matches('.hub-tiles, .shelf')) { out.push(`card outside a grid: ${k.className}`); break; }
      // clutter budget: a block that is only a helper must not push the page's real content down
      const budget = (sel, max, why) => { for (const e of document.querySelectorAll(sel)) { const h = e.getBoundingClientRect().height; if (h > max) out.push(`too tall (${Math.round(h)}px > ${max}px): ${why}`); } };
      budget('.year-card', 170, 'Bible in a Year card');
      budget('.tabbar', 130, 'tab bar (rename tabs shorter, or fewer)');
      budget('.filterbar-top', 60, 'search and filter row');
      budget('.hub-head', 150, 'page header');
      // no loose text hanging at the end of a page: long closing text belongs in a card, a notice or a fold
      for (const pg of document.querySelectorAll('.page:not(.office)')) {
        const kids = [...pg.children].filter((k) => k.getBoundingClientRect().height > 0 && !k.matches('script, style, .no-print, nav, footer'));
        const loose = kids.slice(-2).filter((k) => (k.tagName === 'P' || (k.tagName === 'DIV' && !k.className && !k.querySelector('details, .card, .fold, section, ul, ol, table, .hub-tiles'))) && (k.textContent || '').trim().length > 220);
        if (loose.length) out.push(`long loose text at the end of the page: "${loose[0].textContent.trim().slice(0, 50)}…" (put it in a card, notice or fold)`);
      }
      // menus of tabs and chips wrap; none of them may scroll sideways
      for (const e of document.querySelectorAll('.tabbar, .subnav, .bible-subnav, .chips, .vis-tabs, .ptabs, .year-acts')) {
        const o = getComputedStyle(e).overflowX;
        if ((o === 'auto' || o === 'scroll') && e.scrollWidth > e.clientWidth + 1) out.push(`sideways-scrolling menu: ${e.className}`);
      }
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
