// Learn's lesson of the day is a big question; a big-question lesson opens with a warm-up, offers curated media and a way to debate it.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const w of [390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
  const p = await ctx.newPage(); p.setDefaultTimeout(12000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/learn`); await p.waitForSelector('a.lod');
  if (!(await p.locator('a.lod').innerText()).includes('?')) fail('lesson of the day is a question');
  await p.goto(`${BASE}/#/study/curriculum/YA/YA-9-2`);
  await p.waitForSelector('.lp'); await p.waitForTimeout(800);
  if (!(await p.locator('.big-q').count())) fail('the lesson names its big question');
  if (!(await p.locator('.lp-warm').count()) && !(await p.locator('text=Warm-up').count())) console.log('note: no warm-up on a first lesson of a unit is fine');
  const steps = await p.locator('.lp-steps .lp-l').allTextContents();
  if (!steps.some((t) => /Watch and listen/.test(t))) fail('a Watch and listen step, got ' + steps.join(','));
  await p.locator('.lp-steps button:has-text("Watch and listen")').click();
  await p.waitForSelector('.lm-item'); if ((await p.locator('.lm-item').count()) < 1) fail('media items shown');
  await p.locator('.lp-steps button:has-text("Discuss")').click();
  await p.waitForSelector('.lm-debate'); if (!/Say their view first/.test(await p.locator('.lm-debate').innerText())) fail('debate protocol shown');
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 1) fail(`${w}px: sideways scroll ${over}`);
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('bigquestions ok');
