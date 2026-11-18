// A friend's shared game link must open that game for a brand-new visitor: no tour, no redirect to Today.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
let bad = 0;
for (const [route, h1] of [['play/deepwaters', /basilion/i], ['play/crossword', /crossword/i], ['play/trivia', /./], ['join/ABCD', /./]]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/${route}`); await p.waitForTimeout(2500);
  const at = p.url().split('#')[1];
  const tour = await p.locator('.tour-card, .tour').count();
  const title = await p.locator('h1').first().innerText().catch(() => '');
  if (at !== `/${route}` || tour || !h1.test(title)) { bad++; console.log('FAIL', route, { at, tour, title }); }
  await ctx.close();
}
await b.close();
if (bad) process.exit(1);
console.log('deeplink e2e ok');
