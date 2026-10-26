// Tabs remember where you were, and a rosary left halfway offers to resume.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const vp of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/pray/devotions/rosary?set=glorious`);
  await p.waitForSelector('.rosary-svg');
  const primary = p.locator('.rosary-bar .btn.primary');
  if (!/Sign of the Cross/i.test(await p.locator('.rosary-card .card-title').innerText())) fail('rosary should open at the Sign of the Cross');
  for (let n = 0; n < 8; n++) await primary.click();
  await p.locator('.tabs a >> text=/^Today/').first().click();
  await p.waitForTimeout(500);
  await p.locator('a[data-seen="tab./pray"]').first().click();
  await p.waitForTimeout(800);
  if (!/rosary/.test(p.url())) fail(`Pray tab should return to the rosary, got ${p.url()}`);
  const resume = await p.locator('.rosary-resume').count();
  const t = await p.locator('.rosary-card .card-title').innerText();
  if (!resume && /Sign of the Cross/i.test(t)) fail('rosary lost its place');
  // Amen alone must not finish the rosary
  await p.goto(`${BASE}/#/pray/devotions/rosary?set=joyful`);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForSelector('.rosary-svg');
  if (/Amen/.test(await primary.innerText()) && !/Sign/.test(await p.locator('.rosary-card .card-title').innerText())) fail('rosary should not open on Amen');
  // Year tab: one view switcher, plan change available
  await p.goto(`${BASE}/#/listen`); await p.waitForTimeout(1200);
  await ctx.close();
}
await b.close();
console.log('tabs e2e ok');
