// The study panel's People section shows the same profile card as the profile pages, and opening it leads back to the passage.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:panelTab', 'world'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/study/passage/GEN.3.20`);
const card = p.locator('[data-testid="panel-profiles"] .pcard a:text-is("Adam"), [data-testid="panel-profiles"] .pcard a:text-is("Eve")').first();
try { await card.waitFor({ timeout: 20000 }); } catch { fail('no profile card in the People section'); }
const name = (await card.innerText()).trim();
await card.click();
await p.waitForSelector(`h1:has-text("${name}")`);
if (!(await p.locator('button:has-text("Back to")').count())) fail('no way back to the passage');
await p.click('button:has-text("Back to")');
await p.waitForSelector('[data-testid="panel-profiles"]');
if (errs.length) fail(errs[0]);
await b.close();
console.log('profiles panel e2e ok');
