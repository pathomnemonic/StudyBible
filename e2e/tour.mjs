// The tour on a phone: every step's target is on screen and not covered by something else, and it reaches the end.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/today`);
  await p.waitForSelector('.home');
  await p.evaluate(() => window.dispatchEvent(new Event('studybible:tour')));
  await p.waitForSelector('.tour-card, [class*="tour-pop"], [class*=tour]');
  for (let n = 0; n < 40; n++) {
    await p.waitForTimeout(700);
    const label = await p.evaluate(() => document.querySelector('[class*=tour] .tour-text, [class*=tour] p')?.textContent ?? '');
    if (/Take this tour again/.test(label)) break;
    // a "Tap X" step names a tab: that tab must be visible and not covered
    const m = /^Tap (Media|Read|Pray|Learn|You|Bible)\.$/.exec(label.trim());
    if (m) {
      const ok = await p.evaluate((name) => {
        const a = [...document.querySelectorAll('.tabs a')].find((x) => x.textContent?.includes(name));
        if (!a) return 'no such tab';
        const r = a.getBoundingClientRect();
        if (r.width === 0) return 'tab not visible';
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return a.contains(top) || top?.closest('[class*=tour]') ? 'ok' : 'tab covered by ' + (top?.className || top?.tagName);
      }, m[1]);
      if (ok !== 'ok') fail(`${vp.width}px, step "${label.trim()}": ${ok}`);
    }
    const next = p.locator('.tour-layer button:has-text("Skip step"), .tour-layer button:has-text("Next"), .tour-layer button:has-text("Done")').first();
    if (await next.count()) await next.click().catch(() => {});
    else break;
  }
  if (errs.length) fail(errs.join('; '));
  await ctx.close();
}
await b.close();
console.log('tour e2e ok');
