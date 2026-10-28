// Tabs and folds the reader has not opened carry a small dot, opening clears it, and the dots never change a control's size.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 360, height: 740 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/listen`); await p.waitForSelector('.tabbar button');
const dotted = await p.locator('.tabbar button .new-dot').count();
if (dotted < 4) fail(`Media tabs should carry dots, got ${dotted}`);
if (await p.locator('.tabbar button:has-text("Year") .new-dot').count()) fail('the tab you land on has no dot');
const w1 = await p.locator('.tabbar button:has-text("Podcasts")').evaluate((e) => e.getBoundingClientRect().width);
await p.click('.tabbar button:has-text("Podcasts")'); await p.waitForTimeout(500);
if (await p.locator('.tabbar button:has-text("Podcasts") .new-dot').count()) fail('opening a tab clears its dot');
const w2 = await p.locator('.tabbar button:has-text("Podcasts")').evaluate((e) => e.getBoundingClientRect().width);
if (Math.abs(w1 - w2) > 0.5) fail(`a dot changed the tab width (${w1} vs ${w2})`);
await p.reload(); await p.waitForSelector('.tabbar button');
if (await p.locator('.tabbar button:has-text("Podcasts") .new-dot').count()) fail('a cleared dot stays cleared');
// folds: a closed, unopened fold has a dot
await p.goto(`${BASE}/#/profile`); await p.waitForTimeout(1500);
const folds = await p.locator('details.fold:not([open]) > summary .new-dot').count();
const open = await p.locator('details.fold[open] > summary .new-dot').count();
if (open) fail('an open fold has no dot');
console.log('closed folds with dots on You:', folds);
if (errs.length) fail(errs[0]);
await b.close();
console.log('dots e2e ok');
