// The Bible page's top bar holds five things: the two chapter arrows, the books button, search and the toolbox.
// The toolbox holds the rest; the translation, find and compare live with the books. Choosing a tool closes the sheet.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const w of [320, 390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/read/webc/JHN/1`); await p.waitForSelector('.reader-bar');
  const labels = await p.evaluate(() => [...document.querySelectorAll('.reader-bar > button')].map((e) => e.getAttribute('aria-label') ?? '').filter(Boolean));
  const want = ['Previous chapter', 'Books and translation', 'Search or go to a passage', 'Toolbox', 'Next chapter'];
  if (labels.length !== 5 || want.some((x, i) => !labels[i].startsWith(x))) fail(`${w}px: the bar should hold ${want.join(', ')}; got ${labels.join(' | ')}`);
  if (await p.locator('button[aria-label^="Open the Bible menu"]').count()) fail('the menu button is gone');
  const over = await p.evaluate(() => { const bar = document.querySelector('.reader-bar'); return bar.scrollWidth - bar.clientWidth; });
  if (over > 1) fail(`${w}px: the bar overflows by ${over}px`);
  // the toolbox
  await p.click('button[aria-label^="Toolbox"]');
  await p.waitForSelector('.drawer .bible-tools');
  const t = (await p.locator('.drawer').innerText()).toLowerCase();
  for (const need of ['This chapter', 'Read aloud', 'Focus mode', 'About John']) if (!t.includes(need.toLowerCase())) fail(`${w}px: the toolbox should hold "${need}"`);
  await p.keyboard.press('Escape');
  if (await p.locator('.drawer').count()) fail('Escape should close the toolbox');
  await p.click('button[aria-label^="Toolbox"]');
  await p.locator('.drawer .drawer-grid button >> nth=-1').first().click();
  await p.waitForTimeout(800);
  if (await p.locator('.drawer').count()) fail('choosing a tool should close the sheet');
  // the books sheet, with this reading's settings
  await p.goto(`${BASE}/#/read/webc/JHN/1`); await p.waitForSelector('.reader-bar');
  await p.click('button[aria-label^="Books and translation"]');
  const bt = (await p.locator('.modal').innerText()).toLowerCase();
  for (const need of ['This reading', 'Translation', 'Find in this chapter', 'Compare side by side']) if (!bt.includes(need.toLowerCase())) fail(`${w}px: the books sheet should hold "${need}"`);
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('drawer e2e ok');
