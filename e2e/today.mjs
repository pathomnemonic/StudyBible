// Today on small phones: the date, verse, quote, question and buttons never overlap, with or without scrolling.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
for (const vp of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 412, height: 700 }]) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: true });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`);
  await p.waitForSelector('.home-verse p');
  await p.waitForTimeout(1200);
  for (const y of [0, 60, 200]) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    const bad = await p.evaluate(() => {
      const sel = ['.home-date', '.home-verse', '.home-saint', '.reflect', '.home-extras'];
      const els = sel.map((s) => document.querySelector(s)).filter(Boolean).map((e) => [e.className, e.getBoundingClientRect()]);
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
        const a = els[i][1], c = els[j][1];
        if (a.bottom > c.top + 1 && c.bottom > a.top + 1 && a.right > c.left && c.right > a.left) return `${els[i][0]} overlaps ${els[j][0]}`;
      }
      return '';
    });
    if (bad) { console.error('FAIL', vp.width, vp.height, 'scroll', y, bad); process.exit(1); }
  }
  await ctx.close();
}
await b.close();
console.log('today e2e ok');
