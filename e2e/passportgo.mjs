// A space still to fill in the passport is a link: tapping it goes to that page, which earns the stamp.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(10000);
await p.goto(`${BASE}/#/passport`); await p.waitForSelector('a.pp-go');
await p.locator('a.pp-go').first().click(); await p.waitForTimeout(800);
if (/passport/.test(await p.evaluate(() => location.hash))) { console.error('FAIL did not leave the passport'); process.exit(1); }
await p.goto(`${BASE}/#/passport`); await p.waitForSelector('.pp-big');
if ((await p.locator('.pp-big').innerText()).trim() === '0') { console.error('FAIL no stamp earned'); process.exit(1); }
await b.close(); console.log('passportgo ok');
