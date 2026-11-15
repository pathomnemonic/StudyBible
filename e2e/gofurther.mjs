// Go further, the key-verse review card and Memorize, in a real browser with controlled responses (no live feeds):
//  - a lesson shows its Scripture and Catechism links, and a Scripture link opens the right passage in the selected edition
//  - an edition that lacks the book says so instead of linking somewhere else
//  - a data source that fails is reported (not shown as "nothing to go further to") and recovers on Try again
//  - finishing a lesson offers its memorization card; adding it puts it in Memorize exactly once, even on rapid or repeated clicks
//  - a failed write shows a readable error and leaves the lesson done; a retry works
//  - a verse whose numbering is not verified is not added automatically
//  - Memorize never shows another card's text while a slow passage loads
// Needs the built app on BASE (default http://localhost:4173).
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();
const settingsKey = 'studybible.settings.v1';
async function page(edition) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 1400 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([key, ed]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1');
    if (ed) localStorage.setItem(key, JSON.stringify({ defaultEdition: ed }));
  }, [settingsKey, edition]);
  const p = await ctx.newPage(); p.setDefaultTimeout(15000);
  return { ctx, p };
}
const wholeLesson = async (p, id) => {
  await p.goto(`${BASE}/#/study/curriculum/YA/${id}`);
  await p.locator('button,[role=tab]', { hasText: /^Whole lesson$/ }).first().click();
  await p.waitForSelector('[aria-label="Go further"]:not([data-state="loading"])');
};
const hrefs = (p) => p.locator('[aria-label="Go further"] a').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
const memCount = (p) => p.evaluate(() => new Promise((res, rej) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { const q = r.result.transaction('memory').objectStore('memory').count(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }; r.onerror = () => rej(r.error); }));

// 1. links in the selected edition (WEB-C), and opening one lands on the right passage
{
  const { ctx, p } = await page('webc');
  await wholeLesson(p, 'YA-1-2');
  const h = await hrefs(p);
  for (const want of ['#/read/webc/MAT/28?v=19', '#/read/webc/JHN/1?v=1-14', '#/read/webc/2CO/13?v=13', '#/study/catechism/232']) if (!h.includes(want)) fail(`expected a link to ${want}, got ${h.join(' ')}`);
  await p.locator('[aria-label="Go further"] a', { hasText: 'Matthew 28:19' }).click();
  await p.waitForFunction(() => { const t = document.querySelector('h1.chapter-title'); return t?.dataset.readerBook === 'MAT' && t?.dataset.readerChapter === '28' && t?.dataset.readerReady === 'true'; });
  await p.waitForSelector('[data-v="19"]');
  await ctx.close();
}

// 2. Douay-Rheims (Vulgate numbering): Psalm 63:1-3 in the lesson is Psalm 62:2-4 there
{
  const { ctx, p } = await page('dra');
  await wholeLesson(p, 'YA-3-1');
  const h = await hrefs(p);
  if (!h.includes('#/read/dra/PSA/62?v=2-4')) fail(`Psalm 63:1-3 should open as Psalm 62:2-4 in the Douay-Rheims, got ${h.filter((x) => /PSA/.test(x)).join(' ')}`);
  await ctx.close();
}

// 3. an edition without the New Testament: say so, do not link to another book or chapter
{
  const { ctx, p } = await page('brenton');
  await wholeLesson(p, 'YA-1-2');
  const h = await hrefs(p);
  if (h.some((x) => /^#\/read\//.test(x ?? ''))) fail('no reader link should be offered for a book the edition lacks: ' + h.join(' '));
  if (!/not in this edition/i.test(await p.locator('[aria-label="Go further"] [data-unavailable]').first().innerText())) fail('the missing book should be explained');
  await ctx.close();
}

// 4. a failed data source is reported, and "Try again" recovers
{
  const { ctx, p } = await page('webc');
  let block = true;
  await p.route('**/data/apologetics.json', (r) => (block ? r.abort() : r.continue()));
  await wholeLesson(p, 'YA-1-1');
  const box = p.locator('[aria-label="Go further"]');
  if ((await box.getAttribute('data-state')) === 'complete') fail('a failed source must not look complete');
  if (!/could not be loaded/i.test(await box.innerText())) fail('the failure should be stated');
  if ((await hrefs(p)).some((x) => /study\/apologetics\//.test(x ?? ''))) fail('no apologetics link while its index is unavailable');
  if (!(await hrefs(p)).some((x) => /catechism/.test(x ?? ''))) fail('the links that could be built should still be shown');
  block = false;
  await box.locator('button', { hasText: 'Try again' }).click();
  await p.waitForFunction(() => document.querySelector('[aria-label="Go further"]')?.getAttribute('data-state') === 'complete');
  if (!(await hrefs(p)).some((x) => /study\/apologetics\/god-exists/.test(x ?? ''))) fail('the apologetics link should appear after the retry: ' + (await hrefs(p)).join(' '));
  await ctx.close();
}

// 5. finishing a lesson offers the card; adding it once; rapid and repeated clicks never duplicate
{
  const { ctx, p } = await page('webc');
  await p.goto(`${BASE}/#/study/curriculum/YA/YA-1-2`);
  await p.locator('button,[role=tab]', { hasText: /^Whole lesson$/ }).first().click();
  if (await p.locator('[aria-label="Review later"]').count()) fail('the review card should wait until the lesson is done');
  await p.locator('button', { hasText: /Mark done/ }).first().click();
  await p.waitForSelector('[aria-label="Review later"]');
  await p.evaluate(() => { const btn = [...document.querySelectorAll('[aria-label="Review later"] button')].find((x) => /Add/.test(x.textContent)); btn.click(); btn.click(); btn.click(); });
  await p.waitForSelector('[aria-label="Review later"][data-state="added"]');
  if ((await memCount(p)) !== 1) fail('three rapid clicks must leave exactly one card, got ' + (await memCount(p)));
  await p.reload();
  await p.locator('button,[role=tab]', { hasText: /^Whole lesson$/ }).first().click();
  await p.waitForSelector('[aria-label="Review later"][data-state="added"]');
  if (await p.locator('[aria-label="Review later"] button').count()) fail('once added there is nothing to add again');
  await p.goto(`${BASE}/#/memorize`);
  await p.waitForSelector('text=/Matthew 28:19/');
  const rows = await p.locator('main li, .page li').filter({ hasText: /Matthew 28:19/ }).count();
  if (rows !== 1 || (await memCount(p)) !== 1) fail(`Memorize should list the verse exactly once (rows ${rows}, stored ${await memCount(p)})`);
  await ctx.close();
}

// 6. a failed write: readable error, lesson stays done, retry works
{
  const { ctx, p } = await page('webc');
  await p.goto(`${BASE}/#/study/curriculum/YA/YA-1-2`);
  await p.locator('button,[role=tab]', { hasText: /^Whole lesson$/ }).first().click();
  await p.locator('button', { hasText: /Mark done/ }).first().click();
  await p.waitForSelector('[aria-label="Review later"]');
  await p.evaluate(() => { const add = IDBObjectStore.prototype.add; window.__restoreAdd = () => { IDBObjectStore.prototype.add = add; }; IDBObjectStore.prototype.add = function (...a) { if (this.name === 'memory') throw new DOMException('disk full', 'QuotaExceededError'); return add.apply(this, a); }; });
  await p.locator('[aria-label="Review later"] button', { hasText: /Add/ }).click();
  await p.waitForSelector('[aria-label="Review later"] [data-error]');
  if (!/Could not add it to your review/.test(await p.locator('[data-error]').innerText())) fail('the error should be readable');
  if ((await p.locator('button', { hasText: /Done/ }).first().getAttribute('aria-pressed')) !== 'true') fail('the lesson must stay done when adding the card fails');
  if ((await memCount(p)) !== 0) fail('a failed add must leave nothing behind');
  await p.evaluate(() => window.__restoreAdd());
  await p.locator('[aria-label="Review later"] button', { hasText: /Add/ }).click();
  await p.waitForSelector('[aria-label="Review later"][data-state="added"]');
  if ((await memCount(p)) !== 1) fail('the retry should add one card');
  await ctx.close();
}

// 7. an unverified numbering is not added automatically; the explicit choice is labelled
{
  const { ctx, p } = await page('webc');
  await p.goto(`${BASE}/#/study/curriculum/YA/YA-5-2`);
  await p.locator('button,[role=tab]', { hasText: /^Whole lesson$/ }).first().click();
  await p.locator('button', { hasText: /Mark done/ }).first().click();
  await p.waitForSelector('[aria-label="Review later"][data-state="approximate"]');
  const t = await p.locator('[aria-label="Review later"]').innerText();
  if (!/numbered differently/i.test(t) || !/Add it anyway/.test(t)) fail('the approximate case should explain itself and offer a labelled choice: ' + t);
  if ((await memCount(p)) !== 0) fail('nothing may be added before the user chooses');
  await ctx.close();
}

// 8. Memorize: a slow passage shows Loading, never another card's words; when it arrives it is the right text
{
  const { ctx, p } = await page('webc');
  await p.goto(`${BASE}/#/memorize`);
  await p.waitForSelector('text=/Memorize Scripture/');
  await p.waitForTimeout(1500);
  await p.evaluate(() => new Promise((res, rej) => { const r = indexedDB.open('studybible'); r.onsuccess = () => { const tx = r.result.transaction('memory', 'readwrite'); const s = tx.objectStore('memory'); const base = { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: 0, createdAt: 1 }; s.add({ ...base, ref: 'JHN.3.16' }); s.add({ ...base, ref: 'PSA.22.1' }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }; r.onerror = () => rej(r.error); }));
  await p.route('**/data/bible/webc/PSA.json', async (r) => { await new Promise((x) => setTimeout(x, 2500)); await r.continue(); });
  await p.reload();
  await p.waitForSelector('text=/2 due now/');
  await p.locator('button', { hasText: /Review \(\d+\)/ }).first().click();
  await p.waitForSelector('h1');
  const seen = [];
  for (let i = 0; i < 2; i++) {
    const label = await p.locator('h1').first().innerText();
    // while the passage is loading the card must say so and offer no reveal: it must not show the other card's words
    const reveal = p.locator('button', { hasText: /^(Reveal|Check)$/ });
    const loading = await p.locator('.card', { hasText: 'Loading…' }).count();
    if (loading && !(await reveal.first().isDisabled())) fail(`${label}: Reveal must wait for the passage`);
    await p.waitForFunction(() => !/Loading…/.test(document.querySelector('.card')?.textContent ?? ''), null, { timeout: 15000 });
    await reveal.first().click();
    const body = await p.locator('.card').first().innerText();
    seen.push(`${label}: ${body.slice(0, 60)}`);
    if (/John 3:16/.test(label) && !/loved the world|so loved/i.test(body)) fail(`John 3:16 card shows the wrong text: ${body.slice(0, 80)}`);
    if (/Psalm/.test(label) && /so loved the world/i.test(body)) fail(`the Psalm card is showing John 3:16: ${body.slice(0, 80)}`);
    await p.locator('button', { hasText: /^Good$/ }).click();
    await p.waitForTimeout(200);
  }
  if (!seen.some((x) => /John 3:16/.test(x)) || !seen.some((x) => /Psalm/.test(x))) fail('both cards should have been reviewed: ' + seen.join(' | '));
  await ctx.close();
}

await b.close();
console.log('gofurther e2e ok');
