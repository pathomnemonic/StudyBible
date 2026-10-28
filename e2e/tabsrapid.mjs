// Switching tabs again and again never loses the bottom tab bar or its labels.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${BASE}/#/today`); await p.waitForSelector('.tabs a.tab');
const names = ['You', 'Read', 'Learn', 'Today', 'Bible', 'Pray', 'Media'];
for (let i = 0; i < 70; i++) {
  await p.locator('.tabs a.tab', { hasText: names[(i * 3) % 7] }).tap();
  await p.waitForTimeout(i % 5 === 0 ? 400 : 60);
  if (i % 7 === 0) {
    const st = await p.evaluate(() => { const n = document.querySelector('nav.tabs'); const r = n.getBoundingClientRect(); const cs = getComputedStyle(n); const tabs = [...n.querySelectorAll('a.tab')].filter((t) => t.offsetParent); return { top: r.top, h: r.height, vis: cs.visibility, op: cs.opacity, disp: cs.display, labels: tabs.map((t) => (t.textContent || '').trim()).filter(Boolean).length, filter: cs.backdropFilter, tabOps: tabs.map((t) => getComputedStyle(t).opacity) }; });
    if (st.vis !== 'visible' || st.op !== '1' || st.disp === 'none' || st.h < 40 || st.top < 500) fail(`tab bar hidden at step ${i}: ${JSON.stringify(st)}`);
    if (st.labels < 7) fail(`tab labels missing at step ${i}: ${JSON.stringify(st)}`);
    if (st.tabOps.some((o) => o !== '1')) fail(`a tab is faded at step ${i}: ${JSON.stringify(st.tabOps)}`);
  }
}
if (errs.length) fail(errs[0]);
await b.close();
console.log('tabs rapid e2e ok');
