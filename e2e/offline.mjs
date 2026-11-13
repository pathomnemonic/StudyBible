// First launch online, then offline: what was opened still reads; what was not says so plainly instead of hanging or showing a blank page.
import { chromium } from 'playwright';
import { startServer } from './_server.mjs';
const srv = await startServer();
const BASE = srv.base;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(12000);
const fail = (m) => { console.error('FAIL', m); srv.stop(); process.exit(1); };
await p.goto(`${BASE}/#/read/webc/PSA/23`); await p.waitForSelector('.v');
await p.evaluate(async () => { await navigator.serviceWorker.ready; });
await p.waitForTimeout(2500); // the service worker takes over and the chapter's files are cached
await p.reload(); await p.waitForSelector('.v'); await p.waitForTimeout(1500);
srv.stop(); await ctx.setOffline(true); await new Promise((r) => setTimeout(r, 800)); // nothing answers any more
// 1. the chapter already opened still reads
await p.reload(); await p.waitForSelector('.v');
if (!/shepherd/i.test(await p.locator('.page, main').first().innerText())) fail('an opened chapter should read offline');
if (!(await p.locator('.offline-pill').count())) fail('the app should say it is offline');
// 2. a chapter never opened: a clear message, not a blank page
await p.goto(`${BASE}/#/read/webc/OBA/1`); await p.waitForTimeout(4500);
const t = await p.locator('body').innerText();
if (t.trim().length < 80) fail('blank page for an uncached chapter');
if (!/offline|connection|not (been )?(saved|downloaded|available)|could not|couldn’t|couldn't/i.test(t)) fail('an uncached chapter should say it needs a connection, got: ' + t.slice(0, 200));
await ctx.setOffline(false);
await b.close(); srv.stop(); console.log('offline ok');
