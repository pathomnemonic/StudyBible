// Recent passages in the book picker, and saved translation pairs.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
const picker = async () => { await p.locator('button[aria-label^="Books and translation"]').click(); await p.waitForTimeout(500); };
for (const u of ['JHN/3', 'GEN/1', 'PSA/23']) { await p.goto(`${BASE}/#/read/webc/${u}`); await p.waitForTimeout(1800); }
await picker();
const rec = p.locator('section[aria-label="Recently read"]');
const names = await rec.locator('button').allInnerTexts();
if (!names.some((n) => /John 3/.test(n)) || !names.some((n) => /Genesis 1/.test(n))) fail('recent list shows earlier chapters: ' + names);
await rec.locator('button', { hasText: 'John 3' }).click(); await p.waitForTimeout(1500);
if (!/read\/webc\/JHN\/3/.test(await p.evaluate(() => location.hash))) fail('recent chip opens that chapter');
// saved pair
await picker();
await p.locator('button:text-is("Compare side by side")').click(); await p.waitForTimeout(2000);
await picker();
await p.locator('section[aria-label="Saved pairs"], [role=group][aria-label="Saved translation pairs"] button', { hasText: 'Save' }).first().click(); await p.waitForTimeout(400);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.goto(`${BASE}/#/read/webc/GEN/1`); await p.waitForTimeout(1800);
await picker();
const pair = p.locator('[role=group][aria-label="Saved translation pairs"] button[aria-label^="Read "]');
if (!(await pair.count())) fail('a saved pair is listed after leaving parallel view');
await pair.first().click(); await p.waitForTimeout(2000);
if (!/\?p=/.test(await p.evaluate(() => location.hash))) fail('the saved pair reopens in parallel');
await picker();
await p.locator('button[aria-label^="Forget the pair"]').first().click(); await p.waitForTimeout(300);
if (await p.locator('button[aria-label^="Forget the pair"]').count()) fail('a pair can be forgotten');
await b.close(); console.log('reader-recent-pairs ok');
