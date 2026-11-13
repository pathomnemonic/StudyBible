// The pages added in the ideas batches: each opens without errors and never scrolls sideways on a small phone.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const ROUTES = [ '/study/apologetics-tracks', '/study/apologetics-tracks/atheism', '/study/apologetics-tracks/islam', '/study/apologetics-tracks/natural-law', '/study/apologetics-tracks/mormonism', '/study/ask-fathers', '/study/compare-fathers', '/study/compare-translations?ref=JHN.1.1-5', '/study/apostolic-chain', '/pray/readings-together', '/pray/mass-along', '/pray/office-companion', '/pray/hymns', '/kids/questions', '/passport', '/play/online', '/play/coop', '/play/leaderboard', '/print/booklet', '/teach/parent', '/teach/dashboard', '/study/curriculum/YA/YA-1-1', '/study/curriculum/K/K-1-1', '/study/curriculum/5/5-1-1', '/study/curriculum/9/9-1-1', '/study/mentors/scandal-in-the-church', '/study/lives/antony-of-egypt', '/study/arguments/slavery-and-the-fathers', '/read/webc/PHM/1', '/study/arguments', '/study/arguments/papal-primacy', '/study/arguments/real-presence', '/study/development', '/study/development/christ-natures-development', '/study/heresies', '/study/heresies/arianism', '/study/heresies/pelagianism', '/study/words', '/study/words/logos', '/study/mentors', '/study/mentors/grief', '/study/mentors/new-parent', '/study/lives', '/study/lives/teresa-of-avila', '/study/walks', '/study/walks/water-and-baptism', '/study/church-timelapse', '/study/zoom', '/study/glossed/JHN/1', '/study/zoom/purgatory', '/study/conversation?ref=MAT.16.18', '/study/saint-names?q=anne', '/my-saints', '/play', '/play/trophies', '/play/verbum', '/play/saintguess', '/play/whoami', '/play/wordsearch', '/play/artdetective', '/play/doctrineladder', '/play/quiznight', '/play/whosaid', '/play/chain', '/play/crossword', '/play/pilgrim', '/calendar?y=2027&m=3', '/study/choose-saint', '/study/councils', '/family-sheet?d=2026-11-08', '/teach/bell', '/companion?d=2027-02-10', '/bulletin?d=2026-11-08', '/print/pack', '/print/pack/advent', '/downloads/plan', '/kids/stickers', '/s/term/Faith', '/s/feast/immaculate-conception', '/pray/prayers?tag=home', '/listen?tab=meditate'];
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
    // a route must open its own page: not the not-found page, no redirect elsewhere, and a heading of its own
    const here = await p.evaluate(() => location.hash.replace(/^#/, '').split('?')[0]);
    if (here !== r.split('?')[0]) bad.push(`${w}px ${r}: redirected to ${here}`);
    if (await p.locator('h1:has-text("That page is not here")').count()) bad.push(`${w}px ${r}: shows the not-found page`);
    if (!(await p.locator('main h1, .page h1, h1').count())) bad.push(`${w}px ${r}: no heading of its own`);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) bad.push(`${w}px ${r}: scrolls sideways by ${over}px`);
    if (errs.length) bad.push(`${w}px ${r}: ${errs[0]}`);
  }
  await ctx.close();
}
await b.close();
if (bad.length) { console.error('FAIL\n' + bad.join('\n')); process.exit(1); }
console.log(`newroutes ok on ${ROUTES.length} routes at 320 and 390px`);
