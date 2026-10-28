// The first batch of ideas: each page opens and does its one job.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));

await p.goto(`${BASE}/#/study/saint-names?q=thomas`); await p.waitForSelector('.list li', { timeout: 10000 });
if ((await p.locator('.list li').count()) < 2) fail('saint names: expected several Thomases');

await p.goto(`${BASE}/#/my-saints`); await p.waitForSelector('input[type=date]');
await p.locator('input[type=date]').first().fill('1990-03-19');
await p.waitForSelector('text=Saints of my birthday');
await p.waitForSelector('.card .list li', { timeout: 8000 }).catch(() => fail('birthday saints'));

// finishing a game earns the first trophy and starts a streak
await p.goto(`${BASE}/#/play/whosaid`); await p.waitForSelector('.ws-opt');
for (let i = 0; i < 5; i++) { await p.locator('.ws-opt').first().click(); await p.click('.ws-after .btn.primary'); }
await p.waitForSelector('.trophy-toast', { timeout: 5000 }).catch(() => fail('no trophy toast'));
await p.goto(`${BASE}/#/play/trophies`); await p.waitForSelector('.trophy-grid');
if (!(await p.locator('.trophy-grid li.got').count())) fail('first trophy missing');
await p.goto(`${BASE}/#/play`); await p.waitForSelector('.streak-chip');
if (!(await p.locator('.streak-chip').innerText()).includes('1 day')) fail('streak chip');

if (errs.length) fail(errs.join('; '));
console.log('ok ideas1');
await b.close();
