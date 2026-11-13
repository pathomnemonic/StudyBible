// After a new deploy an old page may ask for a script that no longer exists. The app must recover (reload once) rather than show a blank screen.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
let failed = 0;
await ctx.route(/\/assets\/PassportPage-.*\.js$/, (r) => { if (failed++ < 1) return r.fulfill({ status: 404, body: 'gone' }); return r.continue(); });
await p.goto(`${BASE}/#/today`); await p.waitForSelector('main, .page, .today');
await p.goto(`${BASE}/#/passport`);
await p.waitForSelector('h1', { timeout: 15000 });
const h = await p.locator('h1').first().innerText();
if (/went wrong/i.test(h)) { console.error('FAIL stuck on the error page'); process.exit(1); }
console.log('stalechunk ok, blocked requests:', failed);
await b.close();
