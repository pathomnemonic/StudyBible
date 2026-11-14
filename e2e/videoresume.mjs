// A video you stopped part-way shows under Continue watching and reopens at that point.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => {
  localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1');
  if (!localStorage.getItem('sb:vpos')) localStorage.setItem('sb:vpos', JSON.stringify({ 'shwMd1x-g1g': { t: 600, d: 1500, ts: Date.now(), title: 'Where is the evidence for God?' }, aaaaaaaaaaa: { t: 1490, d: 1500, ts: Date.now(), title: 'Nearly done' } }));
});
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('[aria-label="Continue watching"]');
const txt = await p.locator('[aria-label="Continue watching"]').innerText();
if (!/Where is the evidence/.test(txt) || !/10:00/.test(txt)) fail('resume row shows title and time: ' + txt);
await p.locator('[aria-label="Continue watching"] button:has-text("Resume")').click();
// the player lives in the persistent media host (so it keeps playing across tabs), not inside the list
await p.waitForSelector('.media-host iframe');
const src = await p.locator('.media-host iframe').first().getAttribute('src');
if (!/start=597/.test(src) || !/enablejsapi=1/.test(src)) fail('player opens at the saved point: ' + src);
await b.close(); console.log('videoresume ok');
