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
  const day1 = await p.locator('.reading-bar .rb-label').innerText();
  await p.locator('.reading-bar button[aria-label="Mark today’s reading done"]').click();
  await p.waitForTimeout(600);
  const day2 = await p.locator('.reading-bar .rb-label').innerText();
  if (day1 === day2) fail(`marking done should move on (${day1})`);
  // plan options are hidden for now: no switcher on the reading bar
  if (await p.locator('.reading-bar .rb-change').count()) fail('plan switching should be hidden');
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/read/webc/GEN/1`);
  await p.waitForSelector('.reading-bar', { timeout: 10000 }).catch(() => fail('a brand-new reader should already follow the Bible in a Year podcast'));
  if (!/day 1\//.test(await p.locator('.reading-bar .rb-label').innerText())) fail('a new reader starts at day 1');
  await ctx.close();
}
await b.close();
console.log('plan e2e ok');
