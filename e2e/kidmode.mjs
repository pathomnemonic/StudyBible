// Kid mode limits the app to a few safe places, and a multiplication question lets a grown-up out.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/kid-mode`); await p.click('button:has-text("Start kid mode")');
await p.waitForSelector('.kid-grid');
if ((await p.locator('.tabs a.tab').count()) !== 4) fail('four kid tabs');
for (const away of ['#/profile', '#/read/webc/JHN/1', '#/learn', '#/pray', '#/settings']) { await p.goto(`${BASE}/${away}`); await p.waitForSelector('.kid-grid', { timeout: 5000 }).catch(() => fail(`${away} should lead back to the kids page`)); }
await p.goto(`${BASE}/#/study/kids`); await p.waitForTimeout(1200);
if (/#\/kids$/.test(p.url())) fail('the children’s Bible stories stay open');
await p.goto(`${BASE}/#/kids`); await p.click('button:has-text("For grown-ups")');
const q = await p.locator('.modal p').first().innerText(); const m = /(\d+) × (\d+)/.exec(q);
await p.fill('.modal input', String(+m[1] * +m[2] + 1)); await p.click('button:has-text("Leave kid mode")');
await p.waitForSelector('[role=alert]');
await p.fill('.modal input', String(+m[1] * +m[2])); await p.click('button:has-text("Leave kid mode")');
await p.waitForSelector('.tabs a.tab:has-text("Learn")', { timeout: 8000 }).catch(() => fail('the full tabs come back'));
if (errs.length) fail(errs[0]);
await b.close();
console.log('kid mode e2e ok');
