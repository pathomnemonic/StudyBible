// Bible in a Year list: catching up hides finished days, and the mini player never covers the page.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const vp of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/listen`);
  await p.waitForSelector('.tabbar [role=tab]:has-text("Up next")', { timeout: 20000 });
  const names = await p.locator('.tabbar [role=tab]').allInnerTexts();
  if (names.some((n) => /^All episodes$/i.test(n.trim()))) fail('duplicate "All episodes" tab is back');
  await p.click('text=Coming from another app?');
  await p.fill('input[aria-label="Last day finished"]', '280');
  await p.click('button:has-text("Mark days 1 to 280 finished")');
  await p.waitForTimeout(1200);
  const first = await p.locator('ul.list li').first().innerText();
  if (!/Day 281\b/.test(first)) fail(`after catching up the list should start at day 281, got: ${first.slice(0, 60)}`);
  // player: play the first episode, then make sure nothing important sits under it
  await p.locator('ul.list li button[aria-label*="Play"], ul.list li .btn.play, ul.list li button:has-text("Play")').first().click().catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate(() => { window.scrollTo(0, 1e6); document.scrollingElement.scrollTop = 1e6; document.querySelector('main')?.scrollTo?.(0, 1e6); });
  await p.waitForTimeout(500);
  const hidden = await p.evaluate(() => {
    const pl = document.querySelector('.player'); if (!pl) return 'noplayer';
    const r = pl.getBoundingClientRect();
    const els = [...document.querySelectorAll('main a, main button, main input')].filter((e) => e.offsetParent && !e.closest('.player'));
    const last = els[els.length - 1]; if (!last) return 'none';
    const lr = last.getBoundingClientRect();
    return lr.bottom > r.top + 1 && lr.top < r.bottom ? `last control ${last.textContent?.slice(0, 20)} sits under the player (${Math.round(lr.top)}-${Math.round(lr.bottom)} vs player ${Math.round(r.top)}-${Math.round(r.bottom)}, ${last.tagName}.${last.className})` : 'ok';
  });
  if (hidden !== 'ok' && hidden !== 'noplayer') fail(hidden);
  await p.click('text=Coming from another app?').catch(() => {});
  await p.click('button:has-text("Undo all finished marks")').catch(() => {});
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('episodes e2e ok');
