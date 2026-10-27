// The Bible page has a menu button that opens the study tools in a left sheet; choosing a tool closes it.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const w of [320, 390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/read/webc/JHN/1`);
  await p.click('button[aria-label^="Open the Bible menu"]');
  await p.waitForSelector('.drawer .hub-tile');
  if (!(await p.locator('.drawer .hub-tile').first().isVisible())) fail(`${w}px: the tools should be listed, not folded`);
  await p.keyboard.press('Escape');
  if (await p.locator('.drawer').count()) fail('Escape should close the sheet');
  await p.click('button[aria-label^="Open the Bible menu"]');
  await p.locator('.drawer .hub-tile:visible').first().click();
  await p.waitForTimeout(800);
  if (await p.locator('.drawer').count()) fail('choosing a tool should close the sheet');
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('drawer e2e ok');
