// Tab front pages fit one screen without scrolling in the compact layout (the Bible tab is the exception), and
// Classic still works. Menus the reader opens are allowed to scroll.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const bad = [];
for (const [w, h] of [[360, 740], [390, 844], [412, 915], [1280, 800]]) {
  for (const layout of ['compact', 'classic']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(([l]) => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('studybible.settings.v1', JSON.stringify({ layout: l, audience: 'adult' })); }, [layout]);
    const p = await ctx.newPage();
    for (const r of ['today', 'learn', 'pray', 'listen', 'room', 'profile']) {
      await p.goto(`${BASE}/#/${r}`); await p.waitForTimeout(1500);
      const over = await p.evaluate(() => { const se = document.scrollingElement; return se.scrollHeight - innerHeight; });
      if (layout === 'compact' && over > 1) bad.push(`${w}x${h} compact #/${r}: scrolls by ${over}px`);
    }
    await ctx.close();
  }
}
await b.close();
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('fit ok');
