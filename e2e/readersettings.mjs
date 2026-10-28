// Reading settings put the key controls first; the rest is folded. The settings button is in the reader bar, and the menu holds the chapter actions.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const w of [320, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/read/webc/JHN/1`); await p.waitForSelector('.reader-bar');
  if (await p.locator('.more-btn').count()) fail('the three dots should be gone from the reader bar');
  const over = await p.evaluate(() => { const bar = document.querySelector('.reader-bar'); return bar.scrollWidth - bar.clientWidth; });
  if (over > 1) fail(`${w}px: reader bar overflows by ${over}px`);
  await p.click('.reader-bar button[aria-label*="eading settings" i], .reader-bar button[title^="Text, theme"]');
  await p.waitForSelector('.modal .ts-quick');
  const open = await p.locator('.modal details.fold[open]').count();
  if (open) fail('every group beyond the key controls starts folded');
  const h = await p.locator('.modal').evaluate((e) => e.scrollHeight);
  if (h > 800) fail(`${w}px: the first view of reading settings is too long (${h}px)`);
  for (const need of ['Text size', 'Typeface', 'Theme', 'Verse numbers']) if (!(await p.locator('.modal .ts-quick').innerText()).includes(need)) fail(`quick settings should include ${need}`);
  await p.keyboard.press('Escape');
  await p.click('button[aria-label^="Open the Bible menu"]');
  for (const need of ['Find in this chapter', 'Read aloud', 'Focus mode', 'Translation:']) if (!(await p.locator('.drawer').innerText()).includes(need)) fail(`menu should hold "${need}"`);
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('reader settings e2e ok');
