// "Continue" strips and the History page show what you opened, and the tab pages still fit one screen with them.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const [w, h] of [[360, 740], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/profile`); await p.waitForTimeout(1200);
  if (await p.locator('.continue-strip').count()) fail('nothing to continue on a fresh profile');
  await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForTimeout(2500);
  await p.goto(`${BASE}/#/listen/episode/${await p.evaluate(async () => (await (await fetch('data/media/biay.json')).json()).episodes[0].id)}`); await p.waitForTimeout(1500);
  await p.goto(`${BASE}/#/profile`); await p.waitForTimeout(1500);
  const chips = await p.locator('.continue-chip').allInnerTexts();
  if (chips.length < 1 || !chips.some((t) => /John 3/.test(t))) fail(`${w}px: continue strip should offer John 3, got ${JSON.stringify(chips)}`);
  const over = await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
  if (over > 1) fail(`${w}x${h}: You scrolls by ${over}px with a continue strip`);
  await p.goto(`${BASE}/#/history`); await p.waitForTimeout(1200);
  if (!(await p.locator('.history .list li').count())) fail('history should list what was opened');
  await p.click('.history button:has-text("Clear")').catch(() => {});
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('continue e2e ok');
