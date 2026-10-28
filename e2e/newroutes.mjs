// The pages added in the ideas batches: each opens without errors and never scrolls sideways on a small phone.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const ROUTES = ['/study/saint-names?q=anne', '/my-saints', '/play', '/play/trophies', '/play/verbum', '/play/saintguess', '/play/whoami', '/play/wordsearch', '/play/artdetective', '/play/doctrineladder', '/play/quiznight', '/play/whosaid', '/play/chain', '/play/crossword', '/play/pilgrim', '/calendar?y=2027&m=3', '/study/choose-saint', '/study/councils', '/family-sheet?d=2026-11-08', '/teach/bell', '/companion?d=2027-02-10', '/bulletin?d=2026-11-08', '/print/pack', '/print/pack/advent', '/downloads/plan', '/kids/stickers', '/s/term/Faith', '/s/feast/immaculate-conception', '/pray/prayers?tag=home', '/listen?tab=meditate'];
const b = await chromium.launch();
const bad = [];
for (const w of [320, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 740 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  for (const r of ROUTES) {
    errs.length = 0;
    await p.goto(`${BASE}/#${r}`); await p.waitForTimeout(1200);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) bad.push(`${w}px ${r}: scrolls sideways by ${over}px`);
    if (errs.length) bad.push(`${w}px ${r}: ${errs[0]}`);
  }
  await ctx.close();
}
await b.close();
if (bad.length) { console.error('FAIL\n' + bad.join('\n')); process.exit(1); }
console.log(`newroutes ok on ${ROUTES.length} routes at 320 and 390px`);
