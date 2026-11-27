// Tabs remember where you were, and a rosary left halfway offers to resume.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const vp of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  // seeded on every load, not only the first: the Amen scenario below clears localStorage on purpose,
  // and a once-only seed left the app unseeded (tour, setup) on the reload that follows it
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
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
  // Listen (the Year tab): one view switcher, and the plan view offers the plan's own controls
  await p.goto(`${BASE}/#/listen`);
  await p.waitForSelector('[role="tablist"][aria-label="Episodes"]', { timeout: 15000 });
  if (await p.locator('[role="tablist"][aria-label="Episodes"]').count() !== 1) fail('listen should have exactly one view switcher');
  await p.locator('[role="tablist"] button:has-text("All days")').click();
  await p.waitForSelector('select[aria-label="Release year"]', { timeout: 15000 }); // the plan can be changed (release year) from the plan view
  await ctx.close();
}
await b.close();
console.log('tabs e2e ok');
