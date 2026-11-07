// Teacher view: options respond to what the teacher has, a choice is kept, the plan totals, nothing overflows at 320px.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch(); const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const [w, h] of [[1100, 900], [320, 640]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:cur:mode', 'teacher'); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/study/curriculum/8/8-1-1`); await p.waitForSelector('.teach-opts', { timeout: 8000 }).catch(() => fail('options section missing'));
  const ideas = await p.locator('.to-idea').count(); if (ideas < 2) fail('ideas ' + ideas);
  for (let i = 0; i < ideas; i++) if (await p.locator('.to-idea').nth(i).locator('[role=tab]').count() < 3) fail('idea ' + i + ' has fewer than 3 options');
  // voice only: no screen option anywhere
  await p.getByRole('radio', { name: /Just me/ }).click(); await p.waitForTimeout(200);
  if ((await p.locator('.to-kit', { hasText: /Screen|Student devices/ }).count()) > 0) fail('screen option shown to voice-only teacher');
  // with devices: at least one device/screen option reachable
  await p.getByRole('radio', { name: /Student devices/ }).click(); await p.waitForTimeout(200);
  const tabs = p.locator('.to-idea').first().locator('[role=tab]');
  // choose the second option for idea 1
  await tabs.nth(1).click(); const t2 = (await tabs.nth(1).innerText()).replace(/^B · /, '').replace(' ✓', '');
  await p.locator('.to-idea').first().getByRole('button', { name: /Use this one/ }).click();
  const plan = await p.locator('.to-plan').innerText();
  if (!plan.includes(t2)) fail('plan does not show chosen option: ' + t2);
  if (!/\d+ of \d+ minutes/.test(plan)) fail('no minute total');
  await p.reload(); await p.waitForSelector('.to-plan');
  if (!(await p.locator('.to-plan').innerText()).includes(t2)) fail('choice not kept after reload');
  if (!(await p.getByRole('radio', { name: /Student devices/ }).getAttribute('aria-checked') === 'true')) fail('setup not kept');
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 1) fail(`horizontal overflow ${over}px at ${w}`);
  if (errs.length) fail(errs.join('; '));
  await p.screenshot({ path: `/tmp/teachopts-${w}.png`, fullPage: false });
  await ctx.close();
}
console.log('ok teachopts'); await b.close();
