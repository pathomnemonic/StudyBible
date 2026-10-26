// Random-click fuzzing as a brand-new user: clicks controls at random on every main page and reports script errors,
// overlays that cannot be closed, controls pushed off screen, and sideways scrolling.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const CLICKS = Number(process.env.CLICKS || 25);
let seed = Number(process.env.SEED || 7);
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const SKIP = /delete|remove|clear|reset|sign out|log out|erase|forget|wipe|undo all|export|download|share|print|donate|install|notification|camera|microphone|stop sharing/i;
const routes = ['today', 'read/webc/GEN/1', 'read/webc/JHN/6', 'read/webc/PSA/23', 'bible', 'listen', 'listen?tab=meditate', 'listen?tab=podcasts', 'listen?tab=videos', 'learn', 'study/curriculum/YA', 'study/curriculum/3/3-1-1', 'study/apologetics', 'study/ya', 'pray', 'pray/devotions', 'pray/devotions/rosary?set=joyful', 'pray/plans', 'pray/sleep', 'pray/examen', 'pray/novenas', 'pray/year', 'pray/readings', 'library', 'you', 'study', 'read', 'study/saints', 'study/doctrine', 'study/maps', 'study/kids', 'goals', 'memento', 'share'];
const b = await chromium.launch();
const bad = [];
for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  for (const r of routes) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.addInitScript(() => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await ctx.route('**/*', (route) => (route.request().url().startsWith(BASE) || route.request().url().startsWith('data:') ? route.continue() : route.abort()));
    const tag = `${vp.width}px #/${r}`;
    await p.goto(`${BASE}/#/${r}`).catch(() => {});
    await p.waitForTimeout(900);
    for (let n = 0; n < CLICKS; n++) {
      const els = await p.$$('a[href^="#/"], button, [role=tab], summary, input[type=checkbox], [role=button]');
      const vis = [];
      for (const e of els) { if (await e.isVisible().catch(() => false)) { const t = ((await e.innerText().catch(() => '')) + (await e.getAttribute('aria-label').catch(() => '') || '')).trim(); if (!SKIP.test(t)) vis.push(e); } }
      if (!vis.length) break;
      const e = vis[Math.floor(rnd() * vis.length)];
      const label = ((await e.innerText().catch(() => '')) || (await e.getAttribute('aria-label').catch(() => '')) || '?').slice(0, 30).replace(/\n/g, ' ');
      await e.click({ timeout: 1500, trial: false }).catch(() => {});
      await p.waitForTimeout(250);
      const st = await p.evaluate(() => {
        const out = {};
        out.overflow = document.documentElement.scrollWidth - innerWidth;
        const m = document.querySelector('.modal-back .modal, [role=dialog]');
        if (m) { const c = [...m.querySelectorAll('button')].find((x) => /close|done|cancel|got it|×|✕|back/i.test((x.getAttribute('aria-label') || '') + x.textContent)); const rr = c?.getBoundingClientRect(); out.modal = { hasClose: !!c, onScreen: !!rr && rr.top >= 0 && rr.bottom <= innerHeight && rr.left >= 0 && rr.right <= innerWidth, tall: m.getBoundingClientRect().height > innerHeight + 2 }; }
        out.url = location.href;
        return out;
      }).catch(() => ({}));
      if (st.overflow > 2) bad.push(`${tag}: after “${label}” the page scrolls sideways by ${st.overflow}px`);
      if (st.modal && (!st.modal.hasClose || !st.modal.onScreen) && !/welcome|tour/i.test(await p.locator('[role=dialog]').first().getAttribute('aria-label').catch(() => ''))) {
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
        const still = await p.locator('.modal-back .modal').count();
        bad.push(`${tag}: after “${label}” an overlay has ${st.modal.hasClose ? 'its close button off screen' : 'no close button'}${still ? ' and Escape did not close it' : ' (Escape works)'}`);
      }
      if (st.url && !st.url.startsWith(BASE)) { await p.goto(`${BASE}/#/${r}`).catch(() => {}); }
      if (errs.length) { bad.push(`${tag}: after “${label}” script error: ${errs[0]}`); errs.length = 0; }
    }
    await ctx.close();
  }
}
await b.close();
const uniq = [...new Set(bad)];
if (uniq.length) { console.error(uniq.join('\n')); console.error(uniq.length + ' problems'); process.exit(1); }
console.log('monkey ok');
