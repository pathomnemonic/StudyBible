// An unknown address says so, with a way home, instead of silently landing on Today.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
await p.goto(`${BASE}/#/no/such/page`); await p.waitForSelector('h1:has-text("not here")');
await p.locator('a:has-text("Go to Today")').click(); await p.waitForTimeout(600);
if (/no\/such/.test(await p.evaluate(() => location.hash))) { console.error('FAIL did not leave'); process.exit(1); }
await b.close(); console.log('notfound ok');
