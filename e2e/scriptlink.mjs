// A scripture reference inside a Fathers text opens that passage in the Bible tab.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage();
let found = 0;
for (const sec of [6, 17, 1]) {
  await p.goto(`${BASE}/#/study/works/edersheim-sketches/${sec}`);
  await p.waitForSelector('.work-text');
  await p.waitForTimeout(300);
  found += await p.locator('.work-text a.scrip-ref').count();
}
if (!found) { await p.goto(`${BASE}/#/study/works/edersheim-sketches/6`); await p.waitForTimeout(800); found = await p.locator('.work-text a.scrip-ref').count(); }
if (!found) { console.error('FAIL: no scripture links found in sampled sections'); process.exit(1); }
await p.locator('.work-text a.scrip-ref').first().click();
await p.waitForURL(/#\/read\//);
await p.waitForSelector('.v');
await b.close();
console.log('scriptlink e2e ok', found);
