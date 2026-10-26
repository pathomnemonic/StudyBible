// Today: the pen opens a box, the answer is saved to the journal and comes back on reload.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage();
await p.goto(`${BASE}/#/today`);
await p.click('.reflect-pen');
await p.fill('.reflect-box textarea', 'Lord, help me listen.');
await p.click('.reflect-box .btn.primary');
await p.waitForSelector('.reflect-dot');
await p.reload();
await p.waitForSelector('.reflect-dot');
await p.goto(`${BASE}/#/pray/journal`);
await p.waitForSelector('text=Lord, help me listen.', { timeout: 5000 });
await b.close();
console.log('reflect e2e ok');
