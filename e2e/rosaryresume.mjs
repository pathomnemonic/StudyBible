// A Rosary left part-way is offered again on Pray, and opens with the "carry on" card.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('sb:pray:rosary-joyful', `30|${Date.now()}`); } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/pray`); await p.waitForTimeout(1500);
const chip = p.locator('.continue-chip:has-text("Rosary")');
if (!(await chip.count())) fail('Pray should offer to continue the Rosary');
if (!/decade 2 of 5/.test(await chip.innerText())) fail(`expected decade 2, got ${await chip.innerText()}`);
await chip.click(); await p.waitForTimeout(1500);
if (!(await p.locator('.rosary-resume').count())) fail('the Rosary should offer to carry on from where it stopped');
if (errs.length) fail(errs[0]);
await b.close();
console.log('rosary resume e2e ok');
