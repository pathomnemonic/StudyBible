// Regression checks for bugs reported by hand: duplicate images, raw markup in verses, red letters per edition,
// truncated tab labels, overflow, random verse, Bible in a Year links.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const bad = [];
const note = (m) => { bad.push(m); console.error('FAIL', m); };
for (const vp of [{ width: 320, height: 700 }, { width: 390, height: 800 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const tag = `${vp.width}px`;
  const chapters = ['GEN/1', 'EXO/20', 'PSA/23', 'WIS/9', 'ISA/53', 'MAT/5', 'LUK/2', 'JHN/6', 'ROM/8', 'REV/21'];
  for (const ed of ['webc', 'dra', 'cpdv', 'vulgate']) {
    for (const ch of chapters) {
      if (vp.width !== 390 && !['LUK/2', 'JHN/6', 'WIS/9'].includes(ch)) continue;
      await p.goto(`${BASE}/#/read/${ed}/${ch}`);
      await p.waitForSelector('.chapter, .reading-text, [data-verse], .vfirst', { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => {
        const t = document.body.innerText;
        const imgs = [...document.querySelectorAll('main img')].filter((i) => i.offsetParent).map((i) => i.currentSrc || i.src);
        const dup = imgs.filter((s, i) => imgs.indexOf(s) !== i);
        const figs = [...document.querySelectorAll('figure.inline-art')];
        let adj = 0;
        for (let i = 1; i < figs.length; i++) { const a = figs[i - 1].querySelector('img')?.src, c = figs[i].querySelector('img')?.src; if (a && a === c) adj++; }
        return { raw: /strong="|\\\+w|\\\\|\|G\d{3,4}/.test(t), dup, adj, wj: document.querySelectorAll('.wj').length, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      if (r.raw) note(`${tag} ${ed} ${ch}: raw markup in text`);
      if (r.dup.length) note(`${tag} ${ed} ${ch}: repeated image ${r.dup[0].slice(-40)}`);
      if (r.adj) note(`${tag} ${ed} ${ch}: adjacent identical figures`);
      if (r.overflow > 1) note(`${tag} ${ed} ${ch}: horizontal overflow ${r.overflow}px`);
      if (['LUK/2', 'MAT/5', 'JHN/6'].includes(ch) && ed !== 'vulgate' && r.wj === 0) note(`${tag} ${ed} ${ch}: no red letters`);
      if (ch === 'LUK/2' && ed === 'vulgate' && r.wj === 0) note(`${tag} vulgate LUK/2: no red letters`);
    }
  }
  // tab bar labels must not be clipped
  await p.goto(`${BASE}/#/today`); await p.waitForTimeout(1200);
  const clipped = await p.evaluate(() => [...document.querySelectorAll('.tabs a, .tabs .tab, nav.tabs a')].filter((a) => a.offsetParent).flatMap((a) => [a, ...a.querySelectorAll('span')]).filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent?.trim()));
  if (clipped.length) note(`${tag}: clipped tab labels ${[...new Set(clipped)].join(', ')}`);
  // random verse varies
  if (vp.width === 390) {
    const seen = new Set();
    for (let n = 0; n < 6; n++) {
      await p.goto(`${BASE}/#/today`); await p.waitForTimeout(500);
      const btn = p.locator('button:has-text("Random verse")').first();
      if (!(await btn.count())) { note('random verse button missing'); break; }
      await btn.click(); await p.waitForTimeout(700); seen.add(p.url());
    }
    if (seen.size < 3) note(`random verse repeated: ${seen.size} distinct of 6`);
  }
  if (errs.length) note(`${tag}: page errors ${errs.slice(0, 2).join(' | ')}`);
  await ctx.close();
}
await b.close();
if (bad.length) { console.error(bad.length + ' problems'); process.exit(1); }
console.log('verify ok');
