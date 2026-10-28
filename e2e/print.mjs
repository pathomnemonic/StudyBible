// Printable sheets open for a prayer, the Rosary, a devotion and a novena.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
for (const [path, must] of [['prayer/ave', /Hail Mary/], ['rosary', /Joyful/], ['devotion/litany-humility', /meek and humble/i], ['novena/lourdes', /Lourdes/], ['devotion/litany-sacred-heart', /Heart of Jesus/]]) {
  await p.goto(`${BASE}/#/print/${path}`); await p.waitForSelector('.print-sheet');
  if (!must.test(await p.locator('.print-sheet').innerText())) fail(`${path} should contain ${must}`);
}
await p.goto(`${BASE}/#/print/prayer/nope`); await p.waitForTimeout(600);
if (!/could not be found/.test(await p.locator('.page').innerText())) fail('unknown sheets say so');
await p.goto(`${BASE}/#/pray/devotions/litany-humility`); await p.waitForSelector('a:has-text("Print")');
if (errs.length) fail(errs[0]);
await b.close();
console.log('print e2e ok');
