// Ask the Catechism: a plain question returns paragraphs with Catechism links, and the Learn box sends questions there.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
for (const [q, must] of [['What is purgatory?', /purgatory|purif/i], ['Why do Catholics confess to a priest?', /confess|priest|penance/i], ['Why do we baptize babies?', /infant|baptism|baptize/i]]) {
  await p.goto(`${BASE}/#/study/ask?q=${encodeURIComponent(q)}`);
  await p.waitForSelector('.ask .list li', { timeout: 20000 }).catch(() => fail(`no paragraphs for "${q}"`));
  const txt = await p.locator('.ask .list li').first().innerText();
  if (!must.test(txt)) fail(`first paragraph for "${q}" should be on topic, got: ${txt.slice(0, 120)}`);
  if (!(await p.locator('.ask a.chip[href*="study/catechism/"]').count())) fail('paragraphs should link to the Catechism');
}
await p.goto(`${BASE}/#/learn`); await p.waitForSelector('#ccc-n');
await p.fill('#ccc-n', 'why is Mary honored'); await p.keyboard.press('Enter');
await p.waitForURL(/study\/ask\?q=/);
await p.goto(`${BASE}/#/learn`); await p.fill('#ccc-n', '1324'); await p.keyboard.press('Enter');
await p.waitForURL(/study\/catechism\/1324/);
if (errs.length) fail(errs[0]);
await b.close();
console.log('ask e2e ok');
