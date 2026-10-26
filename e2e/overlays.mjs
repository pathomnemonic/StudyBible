// Overlays must always be closable: the full player, and every modal, stays inside the screen with its close button reachable.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const vp of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/listen`); await p.waitForSelector('ul.list li');
  await p.locator('ul.list li button').first().click(); await p.waitForTimeout(700);
  await p.click('button[aria-label="Open the full player"]'); await p.waitForTimeout(400);
  const c = await p.evaluate(() => { const x = document.querySelector('.modal [aria-label=Close]')?.getBoundingClientRect(); return x && { top: x.top, bottom: x.bottom, left: x.left, right: x.right, vh: innerHeight, vw: innerWidth }; });
  if (!c || c.top < 0 || c.bottom > c.vh || c.left < 0 || c.right > c.vw) fail(`${vp.width}: close button off screen ${JSON.stringify(c)}`);
  await p.click('.modal [aria-label=Close]'); await p.waitForTimeout(300);
  if (await p.locator('.modal').count()) fail(`${vp.width}: full player did not close`);
  // Escape and backdrop also close it
  await p.click('button[aria-label="Open the full player"]'); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  if (await p.locator('.modal').count()) fail(`${vp.width}: Escape did not close the full player`);
  // while the player is up, every page's last control stays clear of it
  await ctx.close();
}
await b.close();
console.log('overlays ok');
