// Today must fit one screen with no scrolling, at common sizes and in the states that add content (a plan, the player, an audience, memento mori).
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch();
const sizes = [[320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1920, 1080]];
const states = {
  fresh: {},
  adult: { audience: 'adult' },
  plan: { activePlan: 'gospels-30' },
  both: { audience: 'adult', activePlan: 'bible-365', memento: { on: true, birthday: '1980-05-05', expectancy: 80, onHome: true, view: 'bar' } },
};
const bad = [];
for (const [name, extra] of Object.entries(states)) {
  for (const [w, h] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(([e]) => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('studybible.settings.v1', JSON.stringify(e)); }, [extra]);
    const p = await ctx.newPage();
    await p.goto(`${BASE}/#/today`); await p.waitForTimeout(300);
    await p.waitForTimeout(1800);
    const r = await p.evaluate(() => { const se = document.scrollingElement; const main = document.querySelector('main'); return { over: se.scrollHeight - innerHeight, mainOver: main ? main.scrollHeight - main.clientHeight : 0, bodyOver: document.body.scrollHeight - innerHeight }; });
    if (r.over > 1 || r.mainOver > 1) bad.push(`${name} ${w}x${h}: scrolls by ${Math.max(r.over, r.mainOver)}px`);
    await ctx.close();
  }
}
await b.close();
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('todayfit ok');
