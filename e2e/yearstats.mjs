// Your year counts what was opened, with no errors and nothing sent anywhere.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/your-year`); await p.waitForSelector('.stat');
const zero = await p.locator('.stat strong').first().innerText();
if (zero !== '0') fail(`a fresh profile has read nothing, got ${zero}`);
for (const ch of ['JHN/3', 'JHN/4', 'GEN/1']) { await p.goto(`${BASE}/#/read/webc/${ch}`); await p.waitForTimeout(1800); }
await p.goto(`${BASE}/#/your-year`); await p.waitForSelector('.stat');
const read = +(await p.locator('.stat strong').first().innerText());
if (read < 2) fail(`chapters read should count, got ${read}`);
if (!(await p.locator('.bars .bar').count())) fail('monthly bars');
await p.click('button[aria-label="Previous year"]'); await p.waitForTimeout(600);
if (errs.length) fail(errs[0]);
await b.close();
console.log('year stats e2e ok');
