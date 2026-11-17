import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
try {
  await p.goto(`${BASE}/#/play`);
  await p.waitForSelector('.pf-tile');
  if (!(await p.locator('.pf-tile:has-text("Deep Waters")').count())) throw new Error('Deep Waters missing from Games home');
  await p.goto(`${BASE}/#/play/deepwaters`);
  await p.waitForSelector('.dw-card');
  if (await p.locator('.dw-progress span').count() !== 7) throw new Error('seven round markers expected');
  await p.waitForSelector('#dw-answer', { state: 'visible', timeout: 7000 });
  const question = await p.locator('.dw-card h2').innerText();
  const answer = question.includes('religious order') ? 'Society of Jesu'
    : question.includes('title or invocation') ? 'Theotokos'
    : question.includes('Church Father') ? 'Augustine'
    : question.includes('ecumenical council') ? 'Nicaea I'
    : question.includes('Catholic Old Testament') ? 'Tobit'
    : question.includes('prayer or devotion') ? 'Rosary'
    : question.includes('liturgical rite') ? 'Latin Church'
    : question.includes('saint who was a pope') ? 'Peter'
    : question.includes('woman in the Bible') ? 'Eve'
    : question.includes('New Testament') ? 'Jerusalem'
    : null;
  if (!answer) throw new Error(`unrecognized Deep Waters prompt in browser test: ${question}`);
  await p.fill('#dw-answer', answer);
  if (answer === 'Society of Jesu') {
    await p.getByRole('button', { name: 'Jesuits' }).waitFor({ state: 'visible' });
    await p.getByRole('button', { name: 'Jesuits' }).click();
    if (await p.locator('#dw-answer').inputValue() !== 'Jesuits') throw new Error('spelling suggestion did not populate input');
  }
  await p.getByRole('button', { name: /Lock it in/ }).click();
  await p.waitForSelector('.dw-reveal');
  if (!(await p.locator('.dw-reveal').innerText()).includes(answer === 'Society of Jesu' ? 'Jesuits' : answer)) throw new Error('recognized answer not revealed');
  await p.waitForFunction(() => localStorage.getItem('sb:deepwaters:session:v1')?.includes('"phase":"locked"'));
  await p.reload();
  await p.waitForSelector('.dw-reveal');
  if (!(await p.locator('.dw-round-count').innerText()).includes('01')) throw new Error('locked round did not restore after reload');
  await p.getByRole('button', { name: 'Next round' }).click();
  await p.waitForSelector('#dw-answer', { state: 'visible', timeout: 7000 });
  if (!(await p.locator('.dw-round-count').innerText()).includes('02')) throw new Error('did not advance to round two');
  if (errors.length) throw new Error(errors.join('; '));
  console.log('deep waters e2e ok: preview, accepted answer, spelling suggestion, reload resume, next round');
} finally {
  await b.close();
}
