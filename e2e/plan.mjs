// Starting a reading plan puts today's reading on Today and in the Bible tab, and "Done" moves it on.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const vp of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/pray/plans`);
  await p.waitForSelector('.btn.small.primary:has-text("Start")');
  await p.locator('.btn.small.primary:has-text("Start")').first().click();
  await p.waitForTimeout(800);
  await p.goto(`${BASE}/#/today`); await p.waitForTimeout(1500);
  if (await p.locator('.reading-bar').count()) fail('Today stays a single calm page: the plan belongs in the Bible tab and the reader');
  await p.goto(`${BASE}/#/read/webc/GEN/1`);
  await p.waitForSelector('.reading-bar', { timeout: 8000 }).catch(() => fail('the reader should show the chosen plan'));
  const listen = await p.locator('.reading-bar .rb-listen').innerText();
  if (!/Day 1\b/.test(listen)) fail(`Genesis 1 should offer the Bible in a Year episode for it, got ${listen}`);
  // the plan lives in the reader menu, and marking done moves it on
  const place = async () => { await p.click('button[aria-label^="Open the Bible menu"]'); const t = await p.locator('.drawer button:has-text("My place in")').innerText(); await p.keyboard.press('Escape'); await p.waitForSelector('.drawer', { state: 'detached' }); return t; };
  const day1 = await place();
  await p.click('button[aria-label^="Open the Bible menu"]'); await p.click('.drawer button:has-text("Mark today’s plan reading done")');
  await p.waitForTimeout(600);
  const day2 = await place();
  if (day1 === day2) fail(`marking done should move on (${day1})`);
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/read/webc/GEN/1`);
  await p.waitForSelector('.reading-bar', { timeout: 10000 }).catch(() => fail('a brand-new reader should already follow the Bible in a Year podcast'));
  await p.click('button[aria-label^="Open the Bible menu"]');
  if (!/day 1\b/.test(await p.locator('.drawer button:has-text("My place in")').innerText())) fail('a new reader starts at day 1');
  await p.keyboard.press('Escape');
  // days finished in the episode list count toward your place, however they were marked
  await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.year-bar');
  await p.click('.year-bar button[aria-label="More"]'); await p.click('[role=menuitem]:has-text("Catch up")');
  await p.fill('input[aria-label="Last day finished"]', '3'); await p.click('button:has-text("finished")');
  await p.waitForTimeout(800);
  await p.goto(`${BASE}/#/read/webc/GEN/1`); await p.waitForSelector('.reading-bar, .reader-bar');
  await p.click('button[aria-label^="Open the Bible menu"]');
  if (!/day 4\b/.test(await p.locator('.drawer button:has-text("My place in")').innerText())) fail('after finishing days 1 to 3 the place should be day 4');
  await ctx.close();
}
await b.close();
console.log('plan e2e ok');
