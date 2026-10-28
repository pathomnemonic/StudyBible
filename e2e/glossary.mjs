// Selecting a term of the faith offers a definition; the glossary page lists terms with Catechism links.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/study/glossary`); await p.waitForSelector('.glossary li');
const n = await p.locator('.glossary li').count();
if (n < 50) fail(`glossary should list many terms, got ${n}`);
await p.fill('input[aria-label="Find a term"]', 'purgatory');
if ((await p.locator('.glossary li').count()) !== 1) fail('searching should narrow to one term');
// select the term's name in the page text and expect the Define button
await p.evaluate(() => { const s = document.querySelector('.glossary li strong'); const r = document.createRange(); r.selectNodeContents(s); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); });
await p.waitForSelector('.glossary-pop button:has-text("Define")', { timeout: 4000 }).catch(() => fail('selecting Purgatory should offer Define'));
await p.click('.glossary-pop button:has-text("Define")');
if (!/purification/i.test(await p.locator('.glossary-card').innerText())) fail('definition should show');
if (errs.length) fail(errs[0]);
await b.close();
console.log('glossary e2e ok');
