// Verbum: type guesses, reject a non-word, finish the game and get a share button.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 360, height: 700 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/play/verbum`); await p.waitForSelector('.vb-grid');
await p.waitForTimeout(600);
for (const c of 'zzzzz') await p.click(`.vb-key:text-is("${c}")`);
await p.click('.vb-key[aria-label="Enter"]');
if (!(await p.locator('.vb-msg').innerText()).includes('Not in')) fail('non-word accepted');
for (let i = 0; i < 5; i++) await p.click('.vb-key[aria-label="Delete"]');
for (const w of ['altar', 'angel', 'bread', 'creed', 'faith', 'grace']) {
  if (await p.locator('.vb-keys').count() === 0) break;
  for (const c of w) await p.click(`.vb-key:text-is("${c}")`);
  await p.click('.vb-key[aria-label="Enter"]');
}
await p.waitForSelector('button:has-text("Share result")', { timeout: 4000 });
if (await p.locator('.vb-cell.hit, .vb-cell.near, .vb-cell.miss').count() < 5) fail('cells not marked');
if (errs.length) fail(errs.join('; '));
console.log('ok verbum');
await b.close();
