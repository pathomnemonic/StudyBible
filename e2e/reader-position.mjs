// Switching translation with no selection keeps the verse at the top of the screen in view; the reader bar and toolbars fit at 320px with 130% text.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 320, height: 700 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
await p.goto(`${BASE}/#/read/webc/PSA/119`); await p.waitForTimeout(2500);
await p.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
// scroll so some verse in the middle is at the top
await p.evaluate(() => window.scrollTo(0, 2500)); await p.waitForTimeout(500);
const top = await p.evaluate(() => { const bar = document.querySelector('.reader-bar').getBoundingClientRect().bottom; return +([...document.querySelectorAll('.scripture [data-v]')].find((e) => e.getBoundingClientRect().bottom > bar + 4)?.dataset.v ?? 0); });
if (top < 5) fail('test setup: expected to be well into the chapter, top verse ' + top);
const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
if (over > 1) fail('sideways scroll at 320px with 130% text: ' + over);
await p.locator('button[aria-label^="Books and translation"]').click(); await p.waitForTimeout(500);
await p.locator('.ed-switch button[aria-pressed="false"]').first().click(); await p.waitForTimeout(3000);
const r = await p.evaluate(() => ({ hash: location.hash, v: (location.hash.match(/v=(\d+)/) ?? [])[1] }));
if (!r.v) fail('switch carried a verse: ' + r.hash);
const inView = await p.evaluate((v) => { const e = document.querySelector(`.scripture [data-v="${v}"]`); if (!e) return false; const x = e.getBoundingClientRect(); return x.bottom > 0 && x.top < innerHeight; }, r.v);
if (!inView) fail('the carried verse is in view after the switch: ' + r.hash);
if (Math.abs(+r.v - top) > 12) fail(`verse moved too far: ${top} -> ${r.v}`);
await b.close(); console.log('reader-position ok');
