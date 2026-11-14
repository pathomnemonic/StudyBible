// Editions and versification, end to end (audit item 9): an address with a translation, book or chapter that does not exist says so instead of
// quietly showing a different one; switching translation keeps the passage and maps Psalm numbers (Greek/Vulgate numbering <-> Hebrew).
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', '1'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); } });
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
const look = async (url) => { await p.goto(`${BASE}/#${url}`); await p.waitForTimeout(1800); return p.evaluate(() => ({ h1: document.querySelector('h1')?.innerText ?? '', verses: document.querySelectorAll('[data-v]').length, hash: location.hash })); };
let r = await look('/read/not-a-translation/JHN/3');
if (!/translation is not available/i.test(r.h1) || r.verses) fail('an unknown translation must say so and show no verses: ' + JSON.stringify(r));
r = await look('/read/webc/XYZ/3');
if (!/not in the Bible/i.test(r.h1) || r.verses) fail('an unknown book must say so (it used to show John): ' + JSON.stringify(r));
r = await look('/read/webc/JHN/99');
if (!/has 21 chapters/i.test(r.h1) || r.verses) fail('a chapter past the end must say so (it used to show the last chapter): ' + JSON.stringify(r));
r = await look('/read/webc/JHN/abc');
if (!/chapter/i.test(r.h1) || r.verses) fail('a chapter that is not a number must say so: ' + JSON.stringify(r));
r = await look('/read/webc/JHN/3');
if (r.h1 !== 'John 3' || !r.verses) fail('a good address still reads: ' + JSON.stringify(r));
// switching translations keeps the passage and maps Psalm numbers
const pick = async (name) => { await p.locator('button[aria-label^="Books and translation"]').click(); await p.waitForTimeout(400); await p.locator(`button:text-is("${name}")`).first().click(); await p.waitForTimeout(2000); return p.evaluate(() => location.hash); };
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForTimeout(1500);
let h = await pick('NABRE'); if (!/read\/nabre\/JHN\/3$/.test(h)) fail('switching translation keeps John 3: ' + h);
await p.goto(`${BASE}/#/read/webc/PSA/23`); await p.waitForTimeout(1500);
h = await pick('NABRE'); if (!/read\/nabre\/PSA\/23$/.test(h)) fail('Psalm 23 (WEB-C, Hebrew numbering) is Psalm 23 in NABRE (same numbering): ' + h);
await b.close(); console.log('editionswitch ok');
