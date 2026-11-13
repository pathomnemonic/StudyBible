// A note written on a verse stays on that verse when the translation changes numbering (English Psalm 51:2 is Douay/Vulgate Psalm 50:4),
// survives a reload, and a reference followed from the study panel can be backed out of.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const pick = async (n) => { await p.locator(`.v[data-v="${n}"] .vn`).first().click(); await p.waitForTimeout(600); };
const mine = async () => { await p.locator('aside.panel [role=tab]', { hasText: /^Mine/ }).click(); await p.waitForTimeout(500); return p.locator('aside.panel').innerText(); };

// 1. write a note on English Psalm 51:2
await p.goto(`${BASE}/#/read/webc/PSA/51`); await p.waitForSelector('.v');
if (!/Wash me thoroughly/.test(await p.locator('.v[data-v="2"]').first().innerText())) fail('expected WEB-C Psalm 51:2 to be "Wash me thoroughly"');
await pick(2);
if (!/Psalm 50/.test(await p.locator('aside.panel').innerText())) fail('the panel should name the Douay/Vulgate numbering (Psalm 50)');
await p.locator('button[aria-label="Write a note on this passage"]').click();
await p.locator('textarea[aria-label="Note text"], textarea').first().fill('E2E versification note');
await p.locator('button:has-text("Save")').last().click(); await p.waitForTimeout(700);

// 2. the same verse in the Douay-Rheims (Vulgate numbering): Psalm 50:4 carries the note
await p.goto(`${BASE}/#/read/dra/PSA/50`); await p.waitForSelector('.v');
if (!/Wash me yet more/.test(await p.locator('.v[data-v="4"]').first().innerText())) fail('expected Douay Psalm 50:4 to be the same verse');
await pick(4);
if (!/E2E versification note/.test(await mine())) fail('the note did not follow the verse into the Douay numbering');
// and it is not on a neighbouring verse
await p.reload(); await p.waitForSelector('.v'); // a fresh selection: tapping a second verse would extend the first (Psalm 50:4-5)
await pick(5);
if (/E2E versification note/.test(await mine())) fail('the note leaked onto the next verse');

// 3. close and reopen: the note is still on the verse, in either numbering
await p.reload(); await p.waitForSelector('.v');
await p.goto(`${BASE}/#/read/webc/PSA/51`); await p.waitForSelector('.v'); await pick(2);
if (!/E2E versification note/.test(await mine())) fail('the note was lost after reopening');

// 4. follow a passage link from the panel and come back to where you were
const link = p.locator('aside.panel a[href*="#/read/"]').first();
if (await link.count()) {
  const origin = await p.evaluate(() => location.hash);
  await link.click(); await p.waitForTimeout(800);
  const there = await p.evaluate(() => location.hash);
  if (there === origin) fail('following a passage link did not move');
  await p.goBack(); await p.waitForTimeout(800);
  if ((await p.evaluate(() => location.hash)) !== origin) fail('back did not return to the passage');
}
await b.close(); console.log('versenote ok');
