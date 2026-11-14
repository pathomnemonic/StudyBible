// The chant notation on the hymns page: opening a score draws real square-note notation (an SVG with notes), says where it comes from,
// can be closed, and fits a phone without scrolling sideways.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); let n = 0;
for (const w of [320, 390, 1024]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/pray/hymns`); await p.waitForSelector('#salve-regina', { timeout: 20000 });
  const card = p.locator('#salve-regina');
  if (await card.locator('svg').count()) fail('the score must not be drawn until asked for');
  await card.locator('button:has-text("Show the chant notation")').click();
  await card.locator('.chant-score svg').waitFor({ timeout: 30000 });
  const info = await card.evaluate((el) => { const s = el.querySelector('.chant-score svg'); const r = s.getBoundingClientRect(); return { paths: s.querySelectorAll('use, path').length, w: r.width, h: r.height, text: el.querySelector('.hy-chant').innerText, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, label: s.getAttribute('aria-label') }; });
  if (info.paths < 40) fail(`${w}px: the notation should contain many note shapes, found ${info.paths}`);
  if (info.w > w) fail(`${w}px: the score is wider than the screen (${info.w})`);
  if (info.scroll > 1) fail(`${w}px: the page scrolls sideways after opening a score`);
  if (!/GregoBase/.test(info.text) || !/public domain/i.test(info.text) || !/no recording/i.test(info.text)) fail('the score must say where it is from and that there is no recording: ' + info.text.slice(0, 200));
  if (!/Salve Regina/.test(info.label ?? '')) fail('the notation needs an accessible name');
  await card.locator('button:has-text("Hide the chant notation")').click();
  if (await card.locator('.chant-score svg').count()) fail('hiding must remove the score');
  if (errs.length) fail(errs[0]);
  n++; await ctx.close();
}
// a hymn without a score offers none
const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage(); await p.goto(`${BASE}/#/pray/hymns`); await p.waitForSelector('#stabat-mater');
if (await p.locator('#stabat-mater button:has-text("chant notation")').count()) fail('a hymn with no checked score must not offer one');
await b.close(); console.log(`chant ok (${n} widths, no score for an unchecked hymn)`);
