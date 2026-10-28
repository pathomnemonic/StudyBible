// Who Said It, Which Book, Chain of Grace, Crossword, Pin the Place: each loads and can be played a little.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));

await p.goto(`${BASE}/#/play/whosaid`); await p.waitForSelector('.ws-opt');
for (let i = 0; i < 5; i++) { await p.locator('.ws-opt').first().click(); await p.click('.ws-after .btn.primary'); }
await p.waitForSelector('.ws-score');

await p.goto(`${BASE}/#/play/whichbook`); await p.waitForSelector('.ws-opt', { timeout: 15000 });
for (let i = 0; i < 5; i++) {
  for (const o of await p.locator('.ws-opt').all()) { if (await p.locator('.ws-after').count()) break; await o.click().catch(() => {}); }
  await p.click('.ws-after .btn.primary');
}
await p.waitForSelector('.ws-score');

await p.goto(`${BASE}/#/play/chain`); await p.waitForSelector('.ch-list');
await p.waitForTimeout(400);
await p.click('button:has-text("Hint")');
const hint = (await p.locator('.vb-msg').innerText()).replace('Try ', '').toLowerCase();
await p.fill('input[aria-label="Next word"]', hint); await p.click('button:has-text("Add")');
if ((await p.locator('.ch-list li').count()) !== 2) fail('hinted word not added');

await p.goto(`${BASE}/#/play/crossword`); await p.waitForSelector('.cw-cell');
await p.locator('.cw-cell').first().click();
await p.keyboard.type('a');
await p.click('button:has-text("Reveal letter")');
if ((await p.locator('.cw-clue').count()) < 6) fail('clues missing');

await p.goto(`${BASE}/#/play/pilgrim`); await p.waitForSelector('.pg-map .leaflet-container, .pg-map.leaflet-container', { timeout: 10000 });
const box = await p.locator('.pg-map').boundingBox();
await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await p.click('button:has-text("Lock in my guess")');
await p.waitForSelector('text=km away');

await p.goto(`${BASE}/#/play`); await p.waitForSelector('.play-card');
if ((await p.locator('.play-card').count()) < 10) fail('games missing from the list');
if (errs.length) fail(errs.join('; '));
console.log('ok games2');
await b.close();
