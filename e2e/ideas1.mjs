// The first batch of ideas: each page opens and does its one job.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));

await p.goto(`${BASE}/#/study/saint-names?q=thomas`); await p.waitForSelector('.list li', { timeout: 10000 });
if ((await p.locator('.list li').count()) < 2) fail('saint names: expected several Thomases');

await p.goto(`${BASE}/#/my-saints`); await p.waitForSelector('input[type=date]');
await p.locator('input[type=date]').first().fill('1990-03-19');
await p.waitForSelector('text=Saints of my birthday');
await p.waitForSelector('.card .list li', { timeout: 8000 }).catch(() => fail('birthday saints'));

// finishing a game earns the first trophy and starts a streak
await p.goto(`${BASE}/#/play/whosaid`); await p.waitForSelector('.ws-opt');
for (let i = 0; i < 5; i++) { await p.locator('.ws-opt').first().click(); await p.click('.ws-after .btn.primary'); }
await p.waitForSelector('.trophy-toast', { timeout: 5000 }).catch(() => fail('no trophy toast'));
await p.goto(`${BASE}/#/play/trophies`); await p.waitForSelector('.trophy-grid');
if (!(await p.locator('.trophy-grid li.got').count())) fail('first trophy missing');
await p.goto(`${BASE}/#/play`); await p.waitForSelector('.streak-chip');
if (!(await p.locator('.streak-chip').innerText()).includes('1 day')) fail('streak chip');

await p.goto(`${BASE}/#/pray/prayers?tag=home`); await p.waitForSelector('text=Blessing of a new home', { timeout: 8000 }).catch(() => fail('home prayers'));

await p.goto(`${BASE}/#/calendar?y=2027&m=3`); await p.waitForSelector('.cal-cell');
if ((await p.locator('.cal-cell:not(.blank)').count()) !== 31) fail('March has 31 days');
if (!(await p.locator('.cal-name').count())) fail('calendar shows some feasts offline');

await p.goto(`${BASE}/#/study/choose-saint`); await p.waitForSelector('.cq .chip');
await p.click('.cq .chip:has-text("Courage")'); await p.click('.cq .chip:has-text("A young person")');
await p.click('button:has-text("Show saints")');
if ((await p.locator('.list li').count()) < 3) fail('confirmation name suggestions');

for (const [path, text] of [['/s/term/Faith', 'Catechism'], ['/s/saint/03-19?i=0', 'Read the whole life'], ['/s/feast/immaculate-conception', 'Church year']]) {
  await p.goto(`${BASE}/#${path}`); await p.waitForSelector(`text=${text}`, { timeout: 8000 }).catch(() => fail(`share page ${path}`));
}
await p.goto(`${BASE}/#/study/glossary`); await p.waitForSelector('.glossary li button:has-text("Share")');

// download one Bible, then the cleaner lists it
await p.goto(`${BASE}/#/downloads`); await p.waitForSelector('h1:has-text("Downloads")');

await p.goto(`${BASE}/#/play/saintguess`); await p.waitForSelector('.sg-clues li');
await p.fill('.sg-input', 'ma'); await p.locator('.sg-matches button').first().click();
for (let i = 0; i < 8 && !(await p.locator('.ws-score').count()); i++) await p.click('button:has-text("Another clue"), button:has-text("Give up")');
await p.waitForSelector('.ws-score'); if (!(await p.locator('.share-wrap button').count())) fail('saint guess share');

await p.goto(`${BASE}/#/play/whoami`); await p.waitForSelector('.sg-clues li');
for (let i = 0; i < 5; i++) { await p.fill('input[aria-label="Your guess"]', 'zzz'); await p.click('button:has-text("Guess")'); }
await p.waitForSelector('.ws-score'); if (!(await p.locator('.share-wrap button').count())) fail('who am i share');

await p.goto(`${BASE}/#/family-sheet?d=2026-11-08`); await p.waitForSelector('.fs-text', { timeout: 15000 }).catch(() => fail('family sheet gospel'));
if ((await p.locator('.fs-level').count()) !== 3) fail('three age levels');

await p.goto(`${BASE}/#/teach/bell`); await p.waitForSelector('.bell-card', { timeout: 10000 }).catch(() => fail('bell ringer card'));
if ((await p.locator('.bell-week li').count()) !== 5) fail('five cards for the week');

await p.goto(`${BASE}/#/share?q=Hello`); await p.waitForSelector('canvas.share-canvas', { timeout: 15000 }).catch(() => fail('saint quote card'));
if (!(await p.locator('h1:has-text("saint")').count())) fail('quote mode heading');

await p.goto(`${BASE}/#/play/wordsearch`); await p.waitForSelector('.ws-cell');
const spot = await p.evaluate(() => {
  const g = [...document.querySelectorAll('.ws-cell')].map((e) => e.textContent); const n = 11;
  const words = [...document.querySelectorAll('.ws-words li')].map((e) => e.textContent);
  for (const w of words) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (const [dr, dc] of [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]]) {
    let ok = true; for (let i = 0; i < w.length && ok; i++) { const rr = r + dr * i, cc = c + dc * i; if (rr < 0 || cc < 0 || rr >= n || cc >= n || g[rr * n + cc] !== w[i]) ok = false; }
    if (ok) return { from: r * n + c, to: (r + dr * (w.length - 1)) * n + (c + dc * (w.length - 1)) };
  }
  return null;
});
if (!spot) fail('a word is in the grid');
const cells = p.locator('.ws-cell'); const a = await cells.nth(spot.from).boundingBox(); const z = await cells.nth(spot.to).boundingBox();
await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down(); await p.mouse.move(z.x + z.width / 2, z.y + z.height / 2, { steps: 6 }); await p.mouse.up();
if (!(await p.locator('.ws-cell.found').count())) fail('dragging across a word should find it');
await p.click('button:has-text("Show all")'); await p.waitForSelector('.ws-score');

await p.goto(`${BASE}/#/play/artdetective`); await p.waitForSelector('.ad-img', { timeout: 15000 });
for (let k = 0; k < 5; k++) {
  for (const o of await p.locator('.ws-opt').all()) { if (await p.locator('.ws-after').count()) break; await o.click().catch(() => {}); }
  await p.click('.ws-after .btn.primary');
}
await p.waitForSelector('.ws-score'); if (!(await p.locator('.share-wrap button').count())) fail('art detective share');

await p.goto(`${BASE}/#/play/doctrineladder`); await p.waitForSelector('.play-card');
if (!(await p.locator('.play-card:disabled').count())) fail('upper levels start locked');
await p.click('.play-card >> nth=0');
for (let k = 0; k < 10; k++) { await p.locator('.ws-opt').first().click(); await p.click('.ws-after .btn.primary'); }
await p.waitForSelector('.ws-score'); if (!(await p.locator('.share-wrap button').count())) fail('ladder share');

await p.goto(`${BASE}/#/study/councils?n=4`); await p.waitForSelector('text=Chalcedon'); await p.waitForSelector('text=Why it met');
if ((await p.locator('ol.councils > li').count()) !== 21) fail('21 councils');

await p.goto(`${BASE}/#/companion?d=2026-12-17`); await p.waitForSelector('text=O Wisdom');
await p.goto(`${BASE}/#/companion?d=2027-02-10`); await p.waitForSelector('text=Ash Wednesday');
await p.click('button:has-text("Mark as done")'); await p.waitForSelector('button:has-text("Done")');

await p.goto(`${BASE}/#/listen?tab=meditate`); await p.waitForSelector('button:has-text("Chant and hymns")');
await p.click('button:has-text("Chant and hymns") >> nth=0');
await p.waitForSelector('.player', { timeout: 8000 }).catch(() => fail('sacred radio should start the player'));

await p.goto(`${BASE}/#/study/kids`); await p.waitForSelector('a[href*="/study/kids/"]');
await p.locator('a[href*="/study/kids/"]').first().click(); await p.waitForSelector('button:has-text("Get a sticker")', { timeout: 10000 });
await p.click('button:has-text("Get a sticker")'); await p.waitForSelector('.trophy-toast:has-text("sticker")', { timeout: 4000 }).catch(() => fail('sticker toast'));
await p.goto(`${BASE}/#/kids/stickers`); await p.waitForSelector('.sticker-grid li.got');

if (errs.length) fail(errs.join('; '));
console.log('ok ideas1');
await b.close();
