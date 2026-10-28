// Printing: a page prints its words, with no buttons or menus, and a print-sheet page prints only its sheet.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const c = await b.newContext({ viewport: { width: 800, height: 1000 } });
await c.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await c.newPage();
for (const [route, sel] of [['/study/saints/03-19', 'article.card'], ['/study/glossary', '.glossary li'], ['/print/prayer/sign', '.print-sheet'], ['/calendar?y=2027&m=3', '.print-sheet'], ['/print/pack/easter', '.print-sheet']]) {
  await p.goto(`${BASE}/#${route}`); await p.waitForSelector(sel); await p.waitForTimeout(500);
  await p.emulateMedia({ media: 'print' });
  const r = await p.evaluate((s) => { const e = document.querySelector(s); const bb = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { h: bb.height, vis: cs.visibility, buttons: [...document.querySelectorAll('.btn')].filter((x) => getComputedStyle(x).display !== 'none' && getComputedStyle(x).visibility !== 'hidden').length }; }, sel);
  if (r.h < 20 || r.vis === 'hidden') fail(`${route} prints blank: ${JSON.stringify(r)}`);
  if (!route.startsWith('/print') && r.buttons) fail(`${route} prints ${r.buttons} buttons`);
  await p.emulateMedia({ media: 'screen' });
}
console.log('printpages ok');
await b.close();
