// First run: a short intro that opens by itself, Bible in a Year branches, skipping, old readers not shown it again,
// red dots that clear when opened, a short note on the first tap of a not-obvious feature, and one-time tips.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const biayRow = (p) => p.evaluate(() => new Promise((res) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { try { const t = r.result.transaction('planProgress').objectStore('planProgress').get('biay'); t.onsuccess = () => res(t.result ?? null); t.onerror = () => res(null); } catch { res(null); } }; r.onerror = () => res(null); }));
for (const vp of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  // 1. a first visit opens the intro by itself; six short cards; Skip on each
  let ctx = await b.newContext({ viewport: vp });
  let p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/today`);
  await p.waitForSelector('.intro-card');
  if (await p.locator('.welcome-dots i').count() !== 6) fail('six cards');
  if (!(await p.locator('.welcome-skip').isVisible())) fail('skip visible');
  const txt = (await p.locator('.intro-card').textContent()) ?? '';
  if (!/saints/i.test(txt)) fail('first card mentions the saints');
  await p.click('.welcome-bar .btn.primary'); // 2 study Bible
  if (!/works by .* authors|saints’ own writings/.test((await p.locator('.intro-card').textContent()) ?? '')) fail('study card');
  await p.click('.welcome-bar .btn.primary'); // 3 Bible in a Year
  await p.waitForSelector('.welcome-chip:has-text("Yes, I was partway through")');
  // listened before: carry on from a day
  await p.click('.welcome-chip:has-text("Yes, I was partway through")');
  await p.fill('input[aria-label="Day number"]', '83');
  await p.waitForFunction(() => /Day 83: ./.test(document.querySelector('.intro-card [role=status]')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('episode title for day 83 should show'));
  await p.click('button:has-text("Carry on from day 83")');
  const row = await biayRow(p);
  if (!row || row.offsetDays !== 82 || row.done.length !== 82) fail('catch-up should mark 82 days heard, got ' + JSON.stringify(row && { o: row.offsetDays, d: row.done.length }));
  // 4
  if (!/hard questions/i.test((await p.locator('.intro-card').textContent()) ?? '')) fail('apologetics card');
  await p.click('.welcome-bar .btn.primary'); // 5
  if (!/LibriVox/.test((await p.locator('.intro-card').textContent()) ?? '')) fail('LibriVox card');
  await p.click('.welcome-bar .btn.primary'); // 6
  if (!(await p.locator('.welcome-note').textContent())?.includes('day 83')) fail('confirmation shown on last card');
  await p.click('.welcome-bar .btn.primary:has-text("Start exploring")');
  await p.waitForSelector('.intro-card', { state: 'detached' });
  const done = await p.evaluate(() => [localStorage.getItem('sb:intro'), localStorage.getItem('sb:tour')].join());
  if (done !== '1,1') fail('intro should be remembered, got ' + done);
  await p.reload(); await p.waitForTimeout(700);
  if (await p.locator('.intro-card').count()) fail('intro should not return');
  // red dots on tabs; the first tap of a not-obvious feature shows its note, then opens it
  const dots = await p.locator('.tabs .new-dot, .tab .new-dot').count();
  if (dots < 3) fail('tab dots expected, got ' + dots);
  await p.goto(`${BASE}/#/learn`); await p.waitForTimeout(900);
  if (!(await p.locator('.tip-card:has-text("Who are the lessons for")').count())) fail('audience question on first Learn visit');
  await p.click('.tip-card button:has-text("A student")');
  if (await p.locator('.tip-card:has-text("Who are the lessons for")').count()) fail('audience question should close');
  await p.goto(`${BASE}/#/more`); await p.waitForTimeout(800);
  const link = p.locator('a[data-seen="learn.arguments"]').first();
  if (await link.count()) {
    await link.evaluate((el) => el.click());
    await p.waitForSelector('.dottip');
    if (!(await p.locator('.dottip').textContent())?.includes('Argument Map')) fail('tip names the feature');
    await p.click('.dottip button:has-text("Open it")');
    await p.waitForFunction(() => location.hash.includes('/study/arguments'));
    await p.goBack(); await p.waitForTimeout(500);
    await p.locator('a[data-seen="learn.arguments"]').first().evaluate((el) => el.click()).catch(() => {});
    if (await p.locator('.dottip').count()) fail('the note appears once');
  }
  // opening Pray clears its dot and shows the tip once
  await p.locator('a[data-seen="tab./pray"]').first().click();
  await p.waitForSelector('.hub-group');
  if (await p.locator('a[data-seen="tab./pray"] .new-dot').count()) fail('dot should clear after opening the tab');
  await p.goto(`${BASE}/#/pray/intentions`);
  await p.waitForSelector('.tip-card');
  await p.click('.tip-card .btn');
  if (await p.locator('.tip-card').count()) fail('tip should dismiss');
  await p.reload(); await p.waitForTimeout(600);
  if (await p.locator('.tip-card').count()) fail('tip should stay dismissed');
  await ctx.close();

  // 2. not listened, would like to: day 1
  ctx = await b.newContext({ viewport: vp }); p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`); await p.waitForSelector('.intro-card');
  await p.click('.welcome-bar .btn.primary'); await p.click('.welcome-bar .btn.primary');
  await p.click('.welcome-chip:has-text("No, but I would like to")');
  await p.click('button:has-text("Start at day 1")');
  const r1 = await biayRow(p);
  if (!r1 || r1.offsetDays !== 0 || r1.done.length !== 0) fail('start should be day 1');
  await ctx.close();

  // 3. not interested: other media, Bible in a Year left out of Today
  ctx = await b.newContext({ viewport: vp }); p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`); await p.waitForSelector('.intro-card');
  await p.click('.welcome-bar .btn.primary'); await p.click('.welcome-bar .btn.primary');
  await p.click('.welcome-chip:has-text("Not for me")');
  await p.waitForSelector('.fav-chip');
  await p.locator('.fav-chip').first().click();
  await p.click('.intro-box button:has-text("Done")');
  const set = await p.evaluate(() => JSON.parse(localStorage.getItem('studybible.settings.v1') ?? '{}'));
  if (set.activePlan !== '' || !(set.dashboard?.hidden ?? []).includes('biay')) fail('Bible in a Year should be left out');
  await ctx.close();

  // 4. skip from the first card: defaults, nothing else asked
  ctx = await b.newContext({ viewport: vp }); p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`); await p.waitForSelector('.intro-card');
  await p.click('.welcome-skip');
  await p.waitForSelector('.intro-card', { state: 'detached' });
  if (await p.locator('.welcome-layer').count()) fail('nothing else blocks the app after skipping');
  await ctx.close();

  // 5. readers who finished the older setup are not shown the intro
  ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`); await p.waitForTimeout(1000);
  if (await p.locator('.intro-card').count()) fail('existing readers should not see the intro');
  if (errs.length) fail('page error: ' + errs[0]);
  await ctx.close();
}
await b.close();
console.log('welcome ok');
