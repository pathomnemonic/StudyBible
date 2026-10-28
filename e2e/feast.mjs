// The feast card opens from Today and shows the day's saint or feast, with a way to keep or share it.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
for (const d of ['2026-12-25', '2026-10-04', '2026-03-17', '2026-06-03']) {
  await p.goto(`${BASE}/#/feast/${d}`); await p.waitForSelector('.feast-card h1', { timeout: 15000 }).catch(() => fail(`no card for ${d}`));
  const h = await p.locator('.feast-card h1').innerText();
  if (h.length < 3) fail(`empty title for ${d}`);
  if ((await p.locator('.feast-card article').innerText()).length < 60) fail(`no text for ${d} (${h})`);
  console.log(d, '->', h);
}
await p.goto(`${BASE}/#/feast/2026-12-25`); await p.waitForSelector('.feast-card h1');
await p.click('.feast-card button:has-text("Save this day")'); await p.waitForSelector('.feast-card button:has-text("Saved")');
if (errs.length) fail(errs[0]);
await b.close();
console.log('feast e2e ok');
