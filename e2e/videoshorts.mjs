// Shorts are kept out of the Feed and marked in the lists that show them.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
await p.goto(`${BASE}/#/study/videos`); await p.waitForSelector('.vid');
if (await p.locator('.vid.short').count()) { console.error('FAIL a Short is in the Feed'); process.exit(1); }
await p.locator('button, a', { hasText: /^All videos/ }).first().click(); await p.waitForTimeout(900);
await p.locator('select[aria-label*="reator" i], select').first().selectOption({ index: 0 }).catch(() => {});
if ((await p.locator('.vid.short .vid-short').count()) < 1) { console.error('FAIL Shorts are not marked in All videos'); process.exit(1); }
await p.screenshot({ path: '/tmp/s-vid.png' });
await b.close(); console.log('videoshorts ok');
