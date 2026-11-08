import { chromium } from 'playwright';
const b = await chromium.launch();
async function play(mode, maxSteps) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('http://localhost:4173/#/play/trivia'); await p.waitForTimeout(2000);
  await p.getByRole('button', { name: mode }).click();
  await p.getByRole('button', { name: 'Start the game' }).click();
  let ans = 0, over = false, stuck = 0, last = '';
  for (let i = 0; i < maxSteps && !over; i++) {
    const body = await p.locator('body').innerText();
    if (/Game over|wins/.test(await p.locator('h1').first().innerText().catch(() => ''))) { over = true; break; }
    const spin = p.getByRole('button', { name: 'Spin', exact: true });
    if (await spin.count()) await spin.click();
    const pick = p.locator('.tv-cat-btn').first(); if (await pick.count()) await pick.click();
    const opt = p.locator('.tv-opt:not(:disabled)').first();
    if (await opt.count()) { await opt.click(); ans++; }
    const nx = p.locator('.tv-why button').first(); if (await nx.count()) await nx.click();
    await p.waitForTimeout(350);
    stuck = body === last ? stuck + 1 : 0; last = body; if (stuck > 25) { console.log(mode, 'STUCK on:', body.slice(0, 200).replace(/\n/g, ' | ')); break; }
  }
  console.log(mode, 'answers', ans, 'over', over, 'h1', await p.locator('h1').first().innerText().catch(() => '?'), 'errors', JSON.stringify(errs));
  await ctx.close();
}
await play('On my own', 200);
await play('Against Brother Bot', 150);
await play('Pass the phone', 80);
await b.close();
