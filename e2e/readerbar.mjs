// The Today saint quote stays on screen as the phone's address bar comes and goes; the chapter arrows sit at the two ends of the reader bar; the verse number opens the study panel on a phone.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const [w, h] of [[390, 680], [360, 640], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/today`); await p.waitForTimeout(2200);
  const shown = async () => p.evaluate(() => { const e = document.querySelector('.home-saint'); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 20; });
  if (!(await shown())) fail(`${w}x${h}: saint quote should be shown`);
  // the address bar collapsing makes the screen taller, then it returns: nothing may come and go
  await p.setViewportSize({ width: w, height: h + 90 }); await p.waitForTimeout(500);
  if (!(await shown())) fail(`${w}x${h}: saint quote after the screen grew`);
  await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(500);
  if (!(await shown())) fail(`${w}x${h}: saint quote after the screen shrank`);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 1) fail(`${w}: sideways scroll ${over}`);
  await ctx.close();
}
for (const w of [390, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: w < 900, isMobile: w < 900 });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/read/webc/JHN/6`); await p.waitForTimeout(2200);
  const pos = await p.evaluate(() => { const bar = document.querySelector('.reader-bar'); const k = [...bar.children].filter((e) => e.getBoundingClientRect().width > 0); const r = bar.getBoundingClientRect(); return { first: k[0].getAttribute('aria-label'), last: k[k.length - 1].getAttribute('aria-label'), l: k[0].getBoundingClientRect().left - r.left, r: r.right - k[k.length - 1].getBoundingClientRect().right }; });
  if (pos.first !== 'Previous chapter' || pos.last !== 'Next chapter') fail(`${w}: arrows at the ends, got ${pos.first} / ${pos.last}`);
  if (Math.abs(pos.l - pos.r) > 12) fail(`${w}: arrows should sit the same distance from each edge (${pos.l} vs ${pos.r})`);
  await p.click('.v[data-v="51"] .vn'); await p.waitForTimeout(1500);
  if (!(await p.locator('aside.panel').count())) fail(`${w}: the verse number should open the study panel`);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/learn`); await p.waitForTimeout(1500);
  if (!(await p.locator('section.learn-card h2:has-text("Bible study")').count())) fail('Learn should have a Bible study section');
  for (const href of ['#/study/books', '#/study/concordance', '#/study/fathers-on', '#/study/lexicon']) if (!(await p.locator(`section.biblestudy a[href="${href}"]`).count())) fail(`Bible study should link to ${href}`);
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 1) fail(`Learn scrolls sideways by ${over}px`);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/#/profile`); await p.waitForTimeout(1200);
  const help = p.locator('a.you-help');
  if (!(await help.count()) || !(await help.isVisible())) fail('the You tab should have a visible Help button');
  await help.click(); await p.waitForTimeout(800);
  if (!/Help/.test(await p.locator('h1').innerText())) fail('Help page opens');
  await p.click('button:has-text("Take the tour again")');
  await p.waitForSelector('.tour-card', { timeout: 8000 }).catch(() => fail('the tour should start from Help'));
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 1) fail(`Help scrolls sideways by ${over}px`);
  await ctx.close();
}
await b.close();
console.log('readerbar ok');
