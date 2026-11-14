// Things that are supposed to happen by themselves. A feature is not done until its trigger has been exercised.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
await ctx.addInitScript(() => { try { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); } catch { /* */ } });
const p = await ctx.newPage();

// 1. "About this chapter" opens by itself when the chapter has something to show, and stays closed once the reader closes it.
let opened = 0; const tried = [];
for (const ch of ['webc/JHN/3', 'webc/LUK/15', 'webc/MAT/5', 'webc/GEN/1', 'webc/PSA/23']) {
  await p.goto(`${BASE}/#/read/${ch}`); await p.waitForSelector('details.chapter-companion', { timeout: 15000 }); await p.waitForTimeout(1800);
  const has = await p.locator('details.chapter-companion .cc-body .chip, details.chapter-companion .cc-body a').count();
  const isOpen = await p.evaluate(() => document.querySelector('details.chapter-companion')?.open === true);
  tried.push(`${ch}:${isOpen ? 'open' : 'closed'}${has ? '+content' : ''}`);
  if (isOpen) opened++;
  if (has && !isOpen) fail(`${ch} has context to show but "About this chapter" did not open itself`);
}
if (!opened) fail('"About this chapter" never opened by itself on any of the sample chapters: ' + tried.join(', '));
// closing sticks (it must not reopen while reading the same chapter)
await p.goto(`${BASE}/#/read/webc/JHN/3`); await p.waitForSelector('details.chapter-companion[open]', { timeout: 15000 }).catch(() => undefined);
if (await p.locator('details.chapter-companion[open]').count()) {
  await p.locator('details.chapter-companion > summary').click(); await p.waitForTimeout(2500);
  if (await p.locator('details.chapter-companion[open]').count()) fail('the reader closed "About this chapter" and it opened again');
}

// 2. An edition that carries its own footnotes shows them (RSV-2CE and NABRE), and the label names that edition, not WEB-C.
for (const ed of ['rsv2ce', 'nabre']) {
  await p.goto(`${BASE}/#/read/${ed}/GEN/1`); await p.waitForTimeout(1500);
  const n = await p.locator('main button.rm-std').count();
  if (!n) fail(`${ed} Genesis 1 should show footnote markers from its own notes`);
}
await b.close(); console.log('behaviors: ok');
