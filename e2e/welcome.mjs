// First run: a short intro that opens by itself, Bible in a Year branches, skipping, old readers not shown it again,
// red dots that clear when opened, a short note on the first tap of a not-obvious feature, and one-time tips.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const biayRow = (p) => p.evaluate(() => new Promise((res) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { try { const t = r.result.transaction('planProgress').objectStore('planProgress').get('biay'); t.onsuccess = () => res(t.result ?? null); t.onerror = () => res(null); } catch { res(null); } }; r.onerror = () => res(null); }));
for (const vp of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  // 1. a first visit starts the tour by itself; it points at real things and waits for the tap
  let ctx = await b.newContext({ viewport: vp });
  let p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const narrow = vp.width < 900;
  const card = async () => (await p.locator('.tour-card').textContent()) ?? '';
  const next = () => p.click('.tour-btns .btn:has-text("Next")');
  await p.goto(`${BASE}/#/today`);
  await p.waitForSelector('.tour-card');
  if (await p.locator('.welcome-layer, .intro-card').count()) fail('no setup cards any more');
  if (!/Today/.test(await card())) fail('first step is Today');
  await next();
  await p.waitForSelector('.v[data-v="51"] .vn'); await p.waitForTimeout(500);
  if (!/little number beside verse 51/.test(await card())) fail('verse number step');
  await p.click('.v[data-v="51"] .vn');
  await p.waitForFunction(() => /Church Fathers and saints, in their own words/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => fail('saints step'));
  if (!(await p.locator('.tour-ring').count())) fail('ring around the saints section');
  await next();
  await p.waitForFunction(() => /Tap Year/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('Year step'));
  await p.click('[role=tab]:has-text("Year")');
  await p.waitForFunction(() => /listened to Bible in a Year/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('Bible in a Year question'));
  await p.click('.tour-card button:has-text("Yes, I was partway through")');
  await p.fill('.tour-card input[aria-label="Day number"]', '83');
  await p.waitForFunction(() => /Day 83: ./.test(document.querySelector('.tour-card [role=status]')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('episode title for day 83 should show'));
  await p.click('.tour-card button:has-text("Carry on from day 83")');
  const row = await biayRow(p);
  if (!row || row.offsetDays !== 82 || row.done.length !== 82) fail('catch-up should mark 82 days heard, got ' + JSON.stringify(row && { o: row.offsetDays, d: row.done.length }));
  await next();
  await p.waitForFunction(() => /Tap Books/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('Books step (no For you step after answering yes)'));
  await p.click('[role=tab]:has-text("Books")');
  await p.waitForFunction(() => /Tap Learn to answer/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => fail('apologetics step'));
  await p.click('a[href="#/study/apologetics-tracks"]');
  await p.waitForFunction(() => /Pick a question/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => fail('tracks step'));
  await next();
  await p.waitForFunction(() => /That is all you need/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('done step'));
  await p.click('.tour-btns .btn:has-text("Done")');
  await p.waitForSelector('.tour-card', { state: 'detached' });
  const done = await p.evaluate(() => [localStorage.getItem('sb:tour'), localStorage.getItem('sb:welcomed')].join());
  if (done !== '1,1') fail('tour should be remembered, got ' + done);
  await p.reload(); await p.waitForTimeout(700);
  if (await p.locator('.tour-card').count()) fail('tour should not return');
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
  await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.tour-card');
  await p.evaluate(() => localStorage.setItem('sb:tourStep', String(3))); await p.reload(); await p.waitForSelector('.tour-card');
  await p.waitForFunction(() => /Tap Year|listened to Bible/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('resume at the Bible in a Year step'));
  if (/Tap Year/.test(await card())) await p.click('[role=tab]:has-text("Year")');
  await p.click('.tour-card button:has-text("No, but I would like to")');
  await p.click('.tour-card button:has-text("Start at day 1")');
  const r1 = await biayRow(p);
  if (!r1 || r1.offsetDays !== 0 || r1.done.length !== 0) fail('start should be day 1');
  await ctx.close();

  // 3. not interested: it is left out of Today and the tour shows where to pick other media
  ctx = await b.newContext({ viewport: vp }); p = await ctx.newPage();
  await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.tour-card');
  await p.evaluate(() => localStorage.setItem('sb:tourStep', String(3))); await p.reload(); await p.waitForSelector('.tour-card');
  if (/Tap Year/.test(await card())) await p.click('[role=tab]:has-text("Year")');
  await p.waitForFunction(() => /listened to Bible in a Year/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 });
  await p.click('.tour-card button:has-text("Not for me")');
  if (!/listen to instead/.test(await card())) fail('"Not for me" offers something else to listen to');
  await p.click('.tour-card button:has-text("The Catechism in a Year")');
  await p.click('.tour-card button:has-text("An audiobook")');
  await p.waitForSelector('.tour-card [aria-label="Audiobooks"] button');
  await p.click('.tour-card [aria-label="Audiobooks"] button >> nth=0');
  await p.click('.tour-card button:has-text("Done")');
  const follows = await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { const t = r.result.transaction('cache').objectStore('cache').getAllKeys(); t.onsuccess = () => res(t.result.filter((k) => String(k).startsWith('follow:'))); }; }));
  if (!follows.includes('follow:catechism-in-a-year') || follows.length < 2) fail('the picks are followed, got ' + JSON.stringify(follows));
  const set = await p.evaluate(() => JSON.parse(localStorage.getItem('studybible.settings.v1') ?? '{}'));
  if (set.activePlan !== '' || !(set.dashboard?.hidden ?? []).includes('biay')) fail('Bible in a Year should be left out');
  await next();
  await p.waitForFunction(() => /Pick other Catholic media/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 }).catch(() => fail('For you step after "not for me"'));
  await ctx.close();

  // 3b. finished it: the same picker, worded for someone who is done
  ctx = await b.newContext({ viewport: vp }); p = await ctx.newPage();
  await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.tour-card');
  await p.evaluate(() => localStorage.setItem('sb:tourStep', '3')); await p.reload(); await p.waitForSelector('.tour-card');
  if (/Tap Year/.test(await card())) await p.click('[role=tab]:has-text("Year")');
  await p.waitForFunction(() => /listened to Bible in a Year/.test(document.querySelector('.tour-card')?.textContent ?? ''), null, { timeout: 8000 });
  await p.click('.tour-card button:has-text("I finished it and want something else")');
  if (!/What would you like to listen to next/.test(await card())) fail('finished readers are asked what is next');
  await p.click('.tour-card button:has-text("The Rosary in a Year")');
  await p.click('.tour-card button:has-text("Done")');
  const set2 = await p.evaluate(() => JSON.parse(localStorage.getItem('studybible.settings.v1') ?? '{}'));
  if (set2.activePlan !== '') fail('Bible in a Year is no longer the active plan');
  await ctx.close();

  // 4. leave the tour from the first step: nothing else asks for anything
  ctx = await b.newContext({ viewport: vp }); p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`); await p.waitForSelector('.tour-card');
  await p.click('.tour-btns .btn:has-text("End tour")');
  await p.waitForSelector('.tour-card', { state: 'detached' });
  if (await p.evaluate(() => localStorage.getItem('sb:tour')) !== '1') fail('ending the tour is remembered');
  await ctx.close();

  // 5. readers who finished the older setup are not shown the intro
  ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`); await p.waitForTimeout(1000);
  if (await p.locator('.tour-card').count()) fail('existing readers should not see the tour');
  if (errs.length) fail('page error: ' + errs[0]);
  await ctx.close();
}
await b.close();
console.log('welcome ok');
