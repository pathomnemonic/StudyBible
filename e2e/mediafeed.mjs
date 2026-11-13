// Media: followed podcasts show as a feed, and the Videos tab opens on a feed of the creators you follow (newest first), with a creators page.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const w of [390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage(); p.setDefaultTimeout(15000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/listen?tab=videos`); await p.waitForTimeout(2000);
  // nothing followed yet: a prompt to choose creators, and still newest first
  if (!(await p.locator('text=Follow creators to fill your feed').count())) fail('asks to follow creators when none are followed');
  await p.click('button:has-text("Choose creators")');
  await p.waitForSelector('.creator-box');
  await p.locator('.creator-box:has-text("Bishop Robert Barron") button:has-text("Follow")').click();
  await p.click('[role=tab]:has-text("Feed")'); await p.waitForTimeout(800);
  const rows = await p.locator('.vid-list .vid').count();
  const channels = await p.evaluate(() => [...document.querySelectorAll('.vid .vid-meta span:first-child')].map((e) => e.textContent));
  if (!rows || channels.some((c) => c !== 'Bishop Robert Barron')) fail('the feed holds only followed creators, got ' + [...new Set(channels)].join(', '));
  // podcasts: follow one, see its episodes as a feed
  await p.goto(`${BASE}/#/listen?tab=podcasts`); await p.waitForTimeout(1500);
  await p.locator('button:has-text("Follow")').first().click(); await p.waitForTimeout(800);
  await p.goto(`${BASE}/#/listen?tab=podcasts`); await p.waitForSelector('section[aria-label="Latest from your podcasts"] .ep', { timeout: 15000 }).catch(() => fail('the Podcasts tab shows a feed of the shows you follow'));
  await p.goto(`${BASE}/#/listen?tab=now`); await p.waitForSelector('section[aria-label="Latest from your podcasts"] .ep', { timeout: 15000 }).catch(() => fail('For you shows the feed too'));
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 1) fail(`${w}px: sideways scroll ${over}`);
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('mediafeed ok');
