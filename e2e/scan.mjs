// A library text taken from an Internet Archive scan offers that scan in the Archive's own viewer: nothing is requested from archive.org until the reader asks.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
let archive = 0; await ctx.route(/archive\.org\//, (r) => { archive++; return r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub viewer</title>' }); });
const p = await ctx.newPage(); p.setDefaultTimeout(20000); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/study/works/roman-catechism/0`); await p.waitForSelector('section[aria-label="Original scan"]');
if (archive) fail('nothing may be requested from archive.org before the reader asks (' + archive + ')');
if (await p.locator('iframe[title*="Internet Archive"]').count()) fail('no viewer before asking');
await p.click('button:has-text("View the original scan")');
const src = await p.locator('iframe[title*="Internet Archive"]').getAttribute('src');
if (src !== 'https://archive.org/embed/catechismofcounc00cathiala') fail('the viewer must open the scan this text came from: ' + src);
const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (over > 1) fail('sideways scroll ' + over);
await p.click('button:has-text("Hide the scan")'); if (await p.locator('iframe[title*="Internet Archive"]').count()) fail('hiding removes the viewer');
// a text whose source is not an Archive scan offers none
await p.goto(`${BASE}/#/study/works/desales-devout-life/0`); await p.waitForTimeout(2500);
const heading = await p.locator('h1,h2').first().innerText();
if (await p.locator('section[aria-label="Original scan"]').count()) fail('only texts with an Archive scan as their source offer one: ' + heading);
if (errs.length) fail(errs[0]);
await b.close(); console.log('scan ok');
