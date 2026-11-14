// Parallel view: a verse missing from one translation is marked "Not in ..." (never a bare dash), the chapter/book alignment notes show,
// and a row can be selected from the keyboard, which opens the verse action toolbar.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage(); p.setDefaultTimeout(20000);
await p.goto(`${BASE}/#/read/webc/EST/4?p=dra`); await p.waitForTimeout(2500);
const r = await p.evaluate(() => ({ miss: [...document.querySelectorAll('[data-missing]')].map((x) => x.textContent), notes: [...document.querySelectorAll('.notice')].map((x) => x.textContent) }));
if (!r.miss.length || !r.miss.every((t) => /Not in/.test(t))) fail('missing verses must say "Not in ...": ' + JSON.stringify(r.miss.slice(0, 2)));
if (!r.notes.some((t) => /verses? (is|are) in only one/.test(t))) fail('a summary of one-sided verses is shown');
if (!r.notes.some((t) => /Greek/.test(t))) fail('the book alignment note shows');
const row = p.locator('table.parallel tbody tr').first();
await row.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
if (!(await p.locator('[role=toolbar][aria-label="Verse actions"]').count())) fail('Enter on a focused row selects it and opens the verse actions');
for (const n of ['Copy text', 'Add note', 'Bookmark', 'Study this passage', 'Compare translations', 'Copy link']) if (!(await p.locator(`[role=toolbar] [aria-label="${n}"]`).count())) fail('action missing: ' + n);
await b.close(); console.log('reader-parallel ok');
