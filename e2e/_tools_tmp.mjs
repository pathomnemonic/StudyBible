import { chromium } from 'playwright';
const S = process.argv[2];
const b = await chromium.launch();
const errs = [];
async function ctx(w, h) { const c = await b.newContext({ viewport: { width: w, height: h } }); await c.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); }); const p = await c.newPage(); p.on('pageerror', (e) => errs.push(String(e))); return p; }
const base = 'http://localhost:5207/#';
for (const [w, h] of [[390, 800], [1280, 900]]) {
  const p = await ctx(w, h);
  await p.goto(base + '/study/compare-translations?ref=JHN.1.1-5&e=webc,cpdv,dra'); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${S}/cmp-${w}.png`, fullPage: true });
  console.log('scrollW', w, await p.evaluate(() => document.documentElement.scrollWidth));
  await p.goto(base + '/study/compare-translations?ref=PSA.22.1-3&e=webc,cpdv'); await p.waitForTimeout(2000);
  await p.screenshot({ path: `${S}/cmp-psa-${w}.png`, fullPage: true });
  const kinds = [['argument', 'real-presence'], ['development', ''], ['heresy', ''], ['claim', ''], ['mentor', 'grief'], ['life', 'augustine'], ['work', 'aug-tractates-john'], ['lesson', 'noah']];
  for (const [k, id] of kinds) {
    await p.goto(base + `/print/booklet?k=${k}&id=${id}&size=a5`); await p.waitForTimeout(1500);
    if (!id) { const o = await p.evaluate(() => [...document.querySelectorAll('select[aria-label="Which booklet"] option')][1]?.value); await p.goto(base + `/print/booklet?k=${k}&id=${o}&size=a5`); await p.waitForTimeout(1500); }
    if (w === 1280) await p.screenshot({ path: `${S}/bk-${k}-${w}.png` });
    console.log(k, w, 'scrollW', await p.evaluate(() => document.documentElement.scrollWidth), 'items', await p.locator('.bk-item').count());
  }
  await p.goto(base + '/print/booklet?k=argument&id=real-presence&size=a5'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${S}/bk-arg-${w}.png`, fullPage: true });
  if (w === 1280) for (const [k, id, size] of [['argument', 'real-presence', 'a5'], ['argument', 'real-presence', 'letter'], ['life', 'augustine', 'a4'], ['work', 'aug-tractates-john', 'a5'], ['lesson', 'noah', 'letter'], ['mentor', 'grief', 'a5']]) {
    await p.goto(base + `/print/booklet?k=${k}&id=${id}&size=${size}`); await p.waitForTimeout(1500);
    await p.emulateMedia({ media: 'print' });
    await p.pdf({ path: `${S}/bk-${k}-${size}.pdf`, preferCSSPageSize: true, printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '13mm', right: '13mm' } });
    await p.emulateMedia({ media: 'screen' });
  }
}
console.log('errors', errs);
await b.close();
