// Study depth: Catechism links at the end of a chapter, the Fathers side by side, highlights to memory, and your own highlight on You.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/read/webc/JHN/6`); await p.waitForSelector('.chapter-ccc a.chip', { timeout: 15000 }).catch(() => fail('John 6 should lead into the Catechism'));
await p.goto(`${BASE}/#/study/fathers-on?ref=JHN.6.51`); await p.waitForSelector('.fo-card', { timeout: 30000 }).catch(() => fail('Fathers on John 6:51 should show cards'));
if ((await p.locator('.fo-card').count()) < 2) fail('several Fathers expected');
// highlight a verse, then memorize it from the library, and see it on You
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForSelector('.v');
await p.locator('.v').nth(15).click(); await p.waitForSelector('.actionbar .sw'); await p.locator('.actionbar .sw').first().click();
await p.goto(`${BASE}/#/library`); await p.click('button:has-text("Highlights")'); await p.waitForSelector('button:has-text("Memorize")');
await p.click('button:has-text("Memorize")');
await p.goto(`${BASE}/#/profile`); await p.waitForSelector('.hl-day', { timeout: 10000 }).catch(() => fail('You should show a highlight of the day'));
if (errs.length) fail(errs[0]);
await b.close();
console.log('study depth e2e ok');
