// RSV-2CE: the licensed edition is offered in the reader, reads correctly, and explains its limits.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForSelector('.reader-bar', { timeout: 8000 });
await p.click('button[aria-label^="Books and translation"]');
await p.waitForSelector('.picker-here .ed-switch button[title*="Revised Standard"]', { timeout: 8000 }).catch(() => fail('RSV-2CE is not offered in the reader'));
await p.click('.picker-here .ed-switch button[title*="Revised Standard"]'); await p.waitForTimeout(1200);
const txt = await p.locator('main').innerText();
if (!/only-begotten Son/.test(txt)) fail('John 3:16 not in RSV wording: ' + txt.slice(0, 300));
if (!/Ignatius|RSV-2CE/.test(await p.locator('body').innerText())) fail('attribution not shown');
await p.screenshot({ path: '/tmp/rsv-reader.png' });
// a deuterocanonical book and a Psalm load too
for (const r of ['WIS/3', 'PSA/23', 'REV/22']) { await p.goto(`${BASE}/#/read/rsv2ce/${r}`); await p.waitForTimeout(900); if ((await p.locator('main').innerText()).length < 200) fail('empty ' + r); }
if (errs.length) fail(errs.join('; '));
console.log('ok rsv2ce');
await b.close();
