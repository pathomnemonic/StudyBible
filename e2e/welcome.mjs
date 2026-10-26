// First run: the setup wizard, red dots that clear when opened, one-time tips, and the Everything page filter.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const vp of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/today`);
  await p.waitForSelector('.welcome-card');
  if (await p.locator('.welcome-dots i').count() !== 5) fail('five steps');
  await p.click('.welcome-chip:has-text("Pray every day")');
  await p.click('.welcome-bar .btn.primary'); // next
  await p.selectOption('select[aria-label="Spelling"]', 'uk');
  await p.click('.welcome-bar .btn.primary');
  await p.click('.welcome-bar .btn.primary');
  await p.click('.welcome-bar .btn.primary');
  await p.waitForSelector('.welcome-start a');
  const first = await p.locator('.welcome-start strong').first().textContent();
  if (!/Mass readings|Prayer list|Rosary|Mercy/.test(first ?? '')) fail('interests should put prayer first, got ' + first);
  await p.click('.welcome-bar .btn.primary:has-text("Start")');
  await p.waitForSelector('.welcome-card', { state: 'detached' });
  const done = await p.evaluate(() => localStorage.getItem('sb:tour'));
  if (done !== '1') fail('setup should be remembered');
  const dots = await p.locator('.tabs .new-dot, .tab .new-dot').count();
  if (dots < 3) fail('tab dots expected, got ' + dots);
  // opening Pray clears its dot and shows the tip once
  await p.locator('a[data-seen="tab./pray"]').first().click();
  await p.waitForSelector('.tip-card');
  const prayDot = await p.locator('a[data-seen="tab./pray"] .new-dot').count();
  if (prayDot) fail('dot should clear after opening the tab');
  await p.click('.tip-card .btn');
  if (await p.locator('.tip-card').count()) fail('tip should dismiss');
  await p.reload(); await p.waitForTimeout(600);
  if (await p.locator('.tip-card').count()) fail('tip should stay dismissed');
  if (await p.locator('.welcome-card').count()) fail('wizard should not return');
  // Everything page: grouped by tab, filterable
  await p.goto(`${BASE}/#/more`);
  await p.waitForSelector('.everything-filter');
  const groups = await p.locator('.tool-group').count();
  if (groups < 6) fail('groups ' + groups);
  await p.fill('.everything-filter', 'rosary');
  await p.waitForTimeout(200);
  const hits = await p.locator('.tool-group li').count();
  if (hits < 1 || hits > 12) fail('rosary search ' + hits);
  // palette finds features by words
  await p.keyboard.press('Control+k');
  await p.fill('.palette input', 'novena');
  await p.waitForTimeout(200);
  if (!(await p.locator('.palette li[role=option]').count())) fail('palette novena');
  if (errs.length) fail(errs.join('; '));
  await ctx.close();
}
await b.close();
console.log('welcome e2e ok');
